from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user
from app.error_handlers import NotFoundError, safe_db_operation, log_error, ConflictError
from app.validators import (
    validate_camp_data, validate_positive_integer, validate_disaster_exists,
    validate_user_exists, validate_camp_coordinator_assignment
)
from app.database_constraints import cascade_delete_camp, get_cascade_preview

router = APIRouter(prefix="/api", tags=["camps"])


@router.get("/camps", response_model=List[schemas.Camp])
async def get_camps(
    skip: int = 0, 
    limit: int = 100, 
    disaster_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all camps, optionally filtered by disaster_id"""
    query = db.query(models.Camp)
    
    if disaster_id:
        query = query.filter(models.Camp.disaster_id == disaster_id)
    
    camps = query.offset(skip).limit(limit).all()
    return camps


@router.get("/camps/{camp_id}", response_model=schemas.Camp)
async def get_camp(camp_id: int, db: Session = Depends(get_db)):
    """Get camp by ID"""
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise HTTPException(status_code=404, detail="Camp not found")
    return camp


@router.post("/camps", response_model=schemas.Camp, status_code=status.HTTP_201_CREATED)
async def create_camp(
    camp: schemas.CampCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Create a new camp (camp coordinator or admin) with comprehensive validation"""
    camp_data = camp.dict()
    
    # Validate camp data including foreign key relationships
    validate_camp_data(camp_data, db)
    
    # Add creator information
    camp_data["created_by"] = current_user.user_id
    
    # Set default status if not provided
    if "status" not in camp_data:
        camp_data["status"] = models.CampStatus.ACTIVE
    
    # Safe database operation
    def create_operation():
        db_camp = models.Camp(**camp_data)
        db.add(db_camp)
        db.commit()
        db.refresh(db_camp)
        return db_camp
    
    try:
        return safe_db_operation(db, create_operation, "create_camp")
    except Exception as e:
        log_error(e, "create_camp", current_user.user_id)
        raise


@router.put("/camps/{camp_id}", response_model=schemas.Camp)
async def update_camp(
    camp_id: int, 
    camp_update: schemas.CampUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Update camp (camp coordinator or admin)"""
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    update_data = camp_update.dict(exclude_unset=True)
    
    # Verify disaster exists if disaster_id is being updated
    if "disaster_id" in update_data:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == update_data["disaster_id"]).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    for field, value in update_data.items():
        setattr(camp, field, value)
    
    db.commit()
    db.refresh(camp)
    return camp


@router.post("/camps/{camp_id}/assign-coordinator")
async def assign_coordinator_to_camp(
    camp_id: int,
    coordinator_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Assign a coordinator to a camp (admin only) with validation"""
    validate_positive_integer(camp_id, "camp_id")
    validate_positive_integer(coordinator_id, "coordinator_id")
    
    # Validate camp exists
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if not camp:
        raise NotFoundError("Camp", camp_id)
    
    # Validate coordinator exists and has correct role
    coordinator = validate_user_exists(db, coordinator_id, "coordinator_id")
    if coordinator.role != models.UserRole.COORDINATOR:
        raise ConflictError("User is not a coordinator", "user_role")
    
    # Validate coordinator assignment constraints
    validate_camp_coordinator_assignment(db, camp_id, coordinator_id)
    
    # Safe database operation
    def assign_operation():
        # Remove coordinator from previous camp if assigned
        if coordinator.assigned_camp_id:
            previous_camp = db.query(models.Camp).filter(
                models.Camp.camp_id == coordinator.assigned_camp_id
            ).first()
            if previous_camp:
                previous_camp.coordinator_id = None
        
        # Assign coordinator to new camp
        camp.coordinator_id = coordinator_id
        coordinator.assigned_camp_id = camp_id
        
        db.commit()
        db.refresh(camp)
        
        return {"message": f"Coordinator {coordinator.full_name} assigned to camp {camp.name}"}
    
    try:
        return safe_db_operation(db, assign_operation, "assign_coordinator")
    except Exception as e:
        log_error(e, "assign_coordinator", current_user.user_id)
        raise


@router.get("/camps/{camp_id}/cascade-preview")
async def get_camp_cascade_preview(
    camp_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Get preview of what would be deleted when deleting a camp (admin only)"""
    validate_positive_integer(camp_id, "camp_id")
    
    # Check if camp exists
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise NotFoundError("Camp", camp_id)
    
    try:
        preview = get_cascade_preview(db, models.Camp, camp_id)
        return preview
    except Exception as e:
        log_error(e, "get_camp_cascade_preview", current_user.user_id)
        raise


@router.delete("/camps/{camp_id}")
async def delete_camp(
    camp_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete camp (admin only) with proper cascade handling"""
    validate_positive_integer(camp_id, "camp_id")
    
    # Check if camp exists
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise NotFoundError("Camp", camp_id)
    
    try:
        # Perform cascade delete
        result = cascade_delete_camp(db, camp_id)
        
        if result.errors:
            raise DatabaseError(
                message="Failed to delete camp due to database constraints",
                original_error=Exception("; ".join(result.errors))
            )
        
        # Commit the transaction since cascade_delete_camp doesn't commit when called standalone
        db.commit()
        
        response = {
            "message": "Camp deleted successfully",
            "cascade_result": result.to_dict()
        }
        
        return response
        
    except Exception as e:
        log_error(e, "delete_camp", current_user.user_id)
        raise