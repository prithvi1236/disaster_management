from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/disasters", response_model=List[schemas.Disaster])
async def get_disasters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all disasters"""
    disasters = db.query(models.Disaster).offset(skip).limit(limit).all()
    return disasters


@router.get("/disasters/{disaster_id}", response_model=schemas.Disaster)
async def get_disaster(disaster_id: int, db: Session = Depends(get_db)):
    """Get disaster by ID"""
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise HTTPException(status_code=404, detail="Disaster not found")
    return disaster


@router.post("/disasters", response_model=schemas.Disaster, status_code=status.HTTP_201_CREATED)
async def create_disaster(disaster: schemas.DisasterCreate, db: Session = Depends(get_db)):
    """Create a new disaster"""
    db_disaster = models.Disaster(**disaster.dict())
    db.add(db_disaster)
    db.commit()
    db.refresh(db_disaster)
    return db_disaster


@router.put("/disasters/{disaster_id}", response_model=schemas.Disaster)
async def update_disaster(
    disaster_id: int, 
    disaster_update: schemas.DisasterUpdate, 
    db: Session = Depends(get_db)
):
    """Update disaster"""
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    update_data = disaster_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(disaster, field, value)
    
    db.commit()
    db.refresh(disaster)
    return disaster


@router.delete("/disasters/{disaster_id}")
async def delete_disaster(disaster_id: int, db: Session = Depends(get_db)):
    """Delete disaster"""
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if disaster is None:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    db.delete(disaster)
    db.commit()
    return {"message": "Disaster deleted successfully"}