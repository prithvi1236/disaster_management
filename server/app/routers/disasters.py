from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user
from app.error_handlers import NotFoundError, safe_db_operation, log_error
from app.validators import validate_disaster_data, validate_positive_integer
from app.database_constraints import cascade_delete_disaster, get_cascade_preview

router = APIRouter(prefix="/api", tags=["disasters"])


@router.get("/disasters", response_model=List[schemas.Disaster])
async def get_disasters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all disasters with pagination validation"""
    # Validate pagination parameters
    validate_positive_integer(skip if skip > 0 else 1, "skip")
    validate_positive_integer(limit, "limit")
    
    if limit > 1000:  # Prevent excessive data retrieval
        limit = 1000
    
    try:
        disasters = db.query(models.Disaster).offset(skip).limit(limit).all()
        return disasters
    except Exception as e:
        log_error(e, "get_disasters")
        raise


@router.get("/disasters/{disaster_id}", response_model=schemas.Disaster)
async def get_disaster(disaster_id: int, db: Session = Depends(get_db)):
    """Get disaster by ID with validation"""
    validate_positive_integer(disaster_id, "disaster_id")
    
    try:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
        if disaster is None:
            raise NotFoundError("Disaster", disaster_id)
        return disaster
    except Exception as e:
        log_error(e, "get_disaster", disaster_id)
        raise


@router.post("/disasters", response_model=schemas.Disaster, status_code=status.HTTP_201_CREATED)
async def create_disaster(
    disaster: schemas.DisasterCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Create a new disaster (admin only) with comprehensive validation"""
    disaster_data = disaster.dict()
    
    # Validate disaster data
    validate_disaster_data(disaster_data)
    
    # Add creator information
    disaster_data["created_by"] = current_user.user_id
    
    # Safe database operation
    def create_operation():
        db_disaster = models.Disaster(**disaster_data)
        db.add(db_disaster)
        db.commit()
        db.refresh(db_disaster)
        return db_disaster
    
    try:
        return safe_db_operation(db, create_operation, "create_disaster")
    except Exception as e:
        log_error(e, "create_disaster", current_user.user_id)
        raise


@router.put("/disasters/{disaster_id}", response_model=schemas.Disaster)
async def update_disaster(
    disaster_id: int, 
    disaster_update: schemas.DisasterUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Update disaster (camp coordinator or admin) with validation"""
    validate_positive_integer(disaster_id, "disaster_id")
    
    # Check if disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise NotFoundError("Disaster", disaster_id)
    
    update_data = disaster_update.dict(exclude_unset=True)
    
    # Validate update data
    if update_data:
        validate_disaster_data(update_data)
    
    # Safe database operation
    def update_operation():
        for field, value in update_data.items():
            setattr(disaster, field, value)
        db.commit()
        db.refresh(disaster)
        return disaster
    
    try:
        return safe_db_operation(db, update_operation, "update_disaster")
    except Exception as e:
        log_error(e, "update_disaster", current_user.user_id)
        raise


@router.get("/disasters/{disaster_id}/cascade-preview")
async def get_disaster_cascade_preview(
    disaster_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Get preview of what would be deleted when deleting a disaster (admin only)"""
    validate_positive_integer(disaster_id, "disaster_id")
    
    # Check if disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise NotFoundError("Disaster", disaster_id)
    
    try:
        preview = get_cascade_preview(db, models.Disaster, disaster_id)
        return preview
    except Exception as e:
        log_error(e, "get_disaster_cascade_preview", current_user.user_id)
        raise


@router.delete("/disasters/{disaster_id}")
async def delete_disaster(
    disaster_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete disaster (admin only) with proper cascade handling"""
    validate_positive_integer(disaster_id, "disaster_id")
    
    # Check if disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise NotFoundError("Disaster", disaster_id)
    
    try:
        # Perform cascade delete
        result = cascade_delete_disaster(db, disaster_id)
        
        if result.errors:
            raise DatabaseError(
                message="Failed to delete disaster due to database constraints",
                original_error=Exception("; ".join(result.errors))
            )
        
        response = {
            "message": "Disaster deleted successfully",
            "cascade_result": result.to_dict()
        }
        
        return response
        
    except Exception as e:
        log_error(e, "delete_disaster", current_user.user_id)
        raise