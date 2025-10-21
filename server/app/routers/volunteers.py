from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user

router = APIRouter(prefix="/api", tags=["volunteers"])


@router.get("/volunteers", response_model=List[schemas.User])
async def get_volunteers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Get all volunteer users"""
    query = db.query(models.User).filter(models.User.role == models.UserRole.VOLUNTEER)
    
    volunteers = query.offset(skip).limit(limit).all()
    return volunteers


@router.get("/volunteers/{volunteer_id}", response_model=schemas.User)
async def get_volunteer(
    volunteer_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Get volunteer by ID"""
    volunteer = db.query(models.User).filter(
        models.User.user_id == volunteer_id,
        models.User.role == models.UserRole.VOLUNTEER
    ).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer


@router.post("/volunteers", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def create_volunteer(volunteer: schemas.UserRegistration, db: Session = Depends(get_db)):
    """Register a new volunteer user"""
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == volunteer.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = db.query(models.User).filter(models.User.username == volunteer.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    from app.auth_utils import get_password_hash
    volunteer_data = volunteer.dict()
    volunteer_data["hashed_password"] = get_password_hash(volunteer_data.pop("password"))
    volunteer_data["role"] = models.UserRole.VOLUNTEER
    
    db_volunteer = models.User(**volunteer_data)
    db.add(db_volunteer)
    db.commit()
    db.refresh(db_volunteer)
    return db_volunteer


@router.put("/volunteers/{volunteer_id}", response_model=schemas.User)
async def update_volunteer(
    volunteer_id: int, 
    volunteer_update: schemas.UserUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Update volunteer user (camp coordinator or admin)"""
    volunteer = db.query(models.User).filter(
        models.User.user_id == volunteer_id,
        models.User.role == models.UserRole.VOLUNTEER
    ).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    update_data = volunteer_update.dict(exclude_unset=True)
    
    # Check if email is being updated and already exists
    if "email" in update_data:
        existing_user = db.query(models.User).filter(
            models.User.email == update_data["email"],
            models.User.user_id != volunteer_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    for field, value in update_data.items():
        setattr(volunteer, field, value)
    
    db.commit()
    db.refresh(volunteer)
    return volunteer


@router.delete("/volunteers/{volunteer_id}")
async def delete_volunteer(
    volunteer_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete volunteer user (admin only)"""
    volunteer = db.query(models.User).filter(
        models.User.user_id == volunteer_id,
        models.User.role == models.UserRole.VOLUNTEER
    ).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    db.delete(volunteer)
    db.commit()
    return {"message": "Volunteer deleted successfully"}