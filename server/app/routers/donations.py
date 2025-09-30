from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/donations", response_model=List[schemas.Donation])
async def get_donations(
    skip: int = 0, 
    limit: int = 100, 
    disaster_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all donations, optionally filtered by disaster_id"""
    query = db.query(models.Donation)
    
    if disaster_id:
        query = query.filter(models.Donation.disaster_id == disaster_id)
    
    donations = query.offset(skip).limit(limit).all()
    return donations


@router.get("/donations/{donation_id}", response_model=schemas.Donation)
async def get_donation(donation_id: int, db: Session = Depends(get_db)):
    """Get donation by ID"""
    donation = db.query(models.Donation).filter(models.Donation.donation_id == donation_id).first()
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation


@router.post("/donations", response_model=schemas.Donation, status_code=status.HTTP_201_CREATED)
async def create_donation(donation: schemas.DonationCreate, db: Session = Depends(get_db)):
    """Create a new donation"""
    # Verify disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == donation.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    db_donation = models.Donation(**donation.dict())
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    return db_donation


@router.put("/donations/{donation_id}", response_model=schemas.Donation)
async def update_donation(
    donation_id: int, 
    donation_update: schemas.DonationUpdate, 
    db: Session = Depends(get_db)
):
    """Update donation"""
    donation = db.query(models.Donation).filter(models.Donation.donation_id == donation_id).first()
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    update_data = donation_update.dict(exclude_unset=True)
    
    # Verify disaster exists if disaster_id is being updated
    if "disaster_id" in update_data:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == update_data["disaster_id"]).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    for field, value in update_data.items():
        setattr(donation, field, value)
    
    db.commit()
    db.refresh(donation)
    return donation


@router.delete("/donations/{donation_id}")
async def delete_donation(donation_id: int, db: Session = Depends(get_db)):
    """Delete donation"""
    donation = db.query(models.Donation).filter(models.Donation.donation_id == donation_id).first()
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found")
    
    db.delete(donation)
    db.commit()
    return {"message": "Donation deleted successfully"}