from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user

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
    """Create a new camp (camp coordinator or admin)"""
    # Verify disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == camp.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    camp_data = camp.dict()
    camp_data["created_by"] = current_user.user_id
    
    # Set default status to avoid enum issues
    if "status" not in camp_data:
        camp_data["status"] = models.CampStatus.ACTIVE
    
    db_camp = models.Camp(**camp_data)
    db.add(db_camp)
    db.commit()
    db.refresh(db_camp)
    return db_camp


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
    """Assign a coordinator to a camp (admin only)"""
    # Check if camp exists
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    # Check if coordinator exists and has correct role
    coordinator = db.query(models.User).filter(
        models.User.user_id == coordinator_id,
        models.User.role == models.UserRole.COORDINATOR
    ).first()
    if not coordinator:
        raise HTTPException(status_code=404, detail="Coordinator not found or user is not a coordinator")
    
    # Assign coordinator to camp
    camp.coordinator_id = coordinator_id
    coordinator.assigned_camp_id = camp_id
    
    db.commit()
    db.refresh(camp)
    
    return {"message": f"Coordinator {coordinator.full_name} assigned to camp {camp.name}"}


@router.delete("/camps/{camp_id}")
async def delete_camp(
    camp_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete camp (admin only)"""
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    db.delete(camp)
    db.commit()
    return {"message": "Camp deleted successfully"}