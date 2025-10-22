from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user

router = APIRouter()


@router.get("/volunteers", response_model=List[schemas.Volunteer])
async def get_volunteers(
    skip: int = 0, 
    limit: int = 100, 
    disaster_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all volunteers, optionally filtered by disaster_id"""
    query = db.query(models.Volunteer)
    
    if disaster_id:
        query = query.filter(models.Volunteer.disaster_id == disaster_id)
    
    volunteers = query.offset(skip).limit(limit).all()
    return volunteers


# Admin-only endpoints (must come before parameterized routes)
@router.get("/volunteers/pending", response_model=List[schemas.PendingVolunteer])
async def get_pending_volunteers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all pending volunteers (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending_volunteers = db.query(models.Volunteer).filter(
        models.Volunteer.status == models.VolunteerStatus.PENDING
    ).all()
    
    # Add days pending calculation
    for volunteer in pending_volunteers:
        days_pending = (datetime.now() - volunteer.created_at).days
        volunteer.days_pending = days_pending
    
    return pending_volunteers


@router.get("/volunteers/approved", response_model=List[schemas.Volunteer])
async def get_approved_volunteers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get approved volunteers available for assignment"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.CAMP_COORDINATOR]:
        raise HTTPException(status_code=403, detail="Admin or Coordinator access required")
    
    approved_volunteers = db.query(models.Volunteer).filter(
        models.Volunteer.status.in_([models.VolunteerStatus.APPROVED, models.VolunteerStatus.ASSIGNED])
    ).all()
    
    return approved_volunteers


@router.get("/volunteers/{volunteer_id}", response_model=schemas.Volunteer)
async def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Get volunteer by ID"""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.volunteer_id == volunteer_id).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer


@router.post("/volunteers", response_model=schemas.Volunteer, status_code=status.HTTP_201_CREATED)
async def create_volunteer(volunteer: schemas.VolunteerCreate, db: Session = Depends(get_db)):
    """Register a new volunteer (starts in PENDING status)"""
    # Check if email already exists
    existing_volunteer = db.query(models.Volunteer).filter(models.Volunteer.email == volunteer.email).first()
    if existing_volunteer:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify disaster exists if disaster_id is provided
    if volunteer.disaster_id:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == volunteer.disaster_id).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    # Create volunteer with PENDING status
    volunteer_data = volunteer.dict()
    volunteer_data['status'] = models.VolunteerStatus.PENDING
    
    db_volunteer = models.Volunteer(**volunteer_data)
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer


@router.put("/volunteers/{volunteer_id}", response_model=schemas.Volunteer)
async def update_volunteer(
    volunteer_id: int, 
    volunteer_update: schemas.VolunteerUpdate, 
    db: Session = Depends(get_db)
):
    """Update volunteer"""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.volunteer_id == volunteer_id).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    update_data = volunteer_update.dict(exclude_unset=True)
    
    # Check if email is being updated and already exists
    if "email" in update_data:
        existing_volunteer = db.query(models.Volunteer).filter(
            models.Volunteer.email == update_data["email"],
            models.Volunteer.volunteer_id != volunteer_id
        ).first()
        if existing_volunteer:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify disaster exists if disaster_id is being updated
    if "disaster_id" in update_data and update_data["disaster_id"]:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == update_data["disaster_id"]).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    for field, value in update_data.items():
        setattr(volunteer, field, value)
    
    db.commit()
    db.refresh(volunteer)
    return volunteer


@router.delete("/volunteers/{volunteer_id}")
async def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Delete volunteer"""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.volunteer_id == volunteer_id).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    db.delete(volunteer)
    db.commit()
    return {"message": "Volunteer deleted successfully"}


@router.put("/volunteers/{volunteer_id}/approve", response_model=schemas.Volunteer)
async def approve_volunteer(
    volunteer_id: int,
    approval: schemas.VolunteerApprovalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Approve or reject volunteer (Admin only)"""
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.volunteer_id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    if volunteer.status != models.VolunteerStatus.PENDING:
        raise HTTPException(status_code=400, detail="Volunteer is not in pending status")
    
    # Update volunteer status
    volunteer.status = approval.status
    volunteer.approved_by = current_user.user_id
    volunteer.approved_date = datetime.now()
    
    if approval.status == models.VolunteerStatus.REJECTED:
        volunteer.rejection_reason = approval.rejection_reason
    
    db.commit()
    db.refresh(volunteer)
    return volunteer