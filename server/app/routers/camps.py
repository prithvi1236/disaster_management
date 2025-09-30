from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter()


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
async def create_camp(camp: schemas.CampCreate, db: Session = Depends(get_db)):
    """Create a new camp"""
    # Verify disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == camp.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    db_camp = models.Camp(**camp.dict())
    db.add(db_camp)
    db.commit()
    db.refresh(db_camp)
    return db_camp


@router.put("/camps/{camp_id}", response_model=schemas.Camp)
async def update_camp(
    camp_id: int, 
    camp_update: schemas.CampUpdate, 
    db: Session = Depends(get_db)
):
    """Update camp"""
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


@router.delete("/camps/{camp_id}")
async def delete_camp(camp_id: int, db: Session = Depends(get_db)):
    """Delete camp"""
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if camp is None:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    db.delete(camp)
    db.commit()
    return {"message": "Camp deleted successfully"}