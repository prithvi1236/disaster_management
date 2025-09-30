from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

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


@router.get("/volunteers/{volunteer_id}", response_model=schemas.Volunteer)
async def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    """Get volunteer by ID"""
    volunteer = db.query(models.Volunteer).filter(models.Volunteer.volunteer_id == volunteer_id).first()
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer


@router.post("/volunteers", response_model=schemas.Volunteer, status_code=status.HTTP_201_CREATED)
async def create_volunteer(volunteer: schemas.VolunteerCreate, db: Session = Depends(get_db)):
    """Register a new volunteer"""
    # Check if email already exists
    existing_volunteer = db.query(models.Volunteer).filter(models.Volunteer.email == volunteer.email).first()
    if existing_volunteer:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify disaster exists if disaster_id is provided
    if volunteer.disaster_id:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == volunteer.disaster_id).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    db_volunteer = models.Volunteer(**volunteer.dict())
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