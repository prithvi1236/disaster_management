from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user

router = APIRouter(prefix="/api/volunteer-assignments", tags=["volunteer-assignments"])


@router.get("/", response_model=List[schemas.VolunteerAssignment])
async def get_volunteer_assignments(
    skip: int = 0, 
    limit: int = 100, 
    volunteer_id: Optional[int] = Query(None),
    camp_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all volunteer assignments, optionally filtered by volunteer or camp"""
    query = db.query(models.VolunteerAssignment)
    
    if volunteer_id:
        query = query.filter(models.VolunteerAssignment.volunteer_id == volunteer_id)
    
    if camp_id:
        query = query.filter(models.VolunteerAssignment.camp_id == camp_id)
    
    assignments = query.offset(skip).limit(limit).all()
    return assignments


@router.get("/{assignment_id}", response_model=schemas.VolunteerAssignment)
async def get_volunteer_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Get volunteer assignment by ID"""
    assignment = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.assignment_id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Volunteer assignment not found")
    return assignment


@router.post("/", response_model=schemas.VolunteerAssignment, status_code=status.HTTP_201_CREATED)
async def create_volunteer_assignment(
    assignment_data: schemas.VolunteerAssignmentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Create a new volunteer assignment (camp coordinator or admin)"""
    # Verify volunteer exists
    volunteer = db.query(models.User).filter(
        models.User.user_id == assignment_data.volunteer_id,
        models.User.role == models.UserRole.VOLUNTEER
    ).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Verify disaster exists
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == assignment_data.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    # Verify camp exists if camp_id is provided
    if assignment_data.camp_id:
        camp = db.query(models.Camp).filter(models.Camp.camp_id == assignment_data.camp_id).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Camp not found")
    
    assignment_dict = assignment_data.dict()
    assignment_dict["assigned_by"] = current_user.user_id
    
    db_assignment = models.VolunteerAssignment(**assignment_dict)
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.put("/{assignment_id}", response_model=schemas.VolunteerAssignment)
async def update_volunteer_assignment(
    assignment_id: int, 
    assignment_update: schemas.VolunteerAssignmentUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Update volunteer assignment (camp coordinator or admin)"""
    assignment = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.assignment_id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Volunteer assignment not found")
    
    update_data = assignment_update.dict(exclude_unset=True)
    
    # Verify camp exists if camp_id is being updated
    if "camp_id" in update_data and update_data["camp_id"]:
        camp = db.query(models.Camp).filter(models.Camp.camp_id == update_data["camp_id"]).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Camp not found")
    
    for field, value in update_data.items():
        setattr(assignment, field, value)
    
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}")
async def delete_volunteer_assignment(
    assignment_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete volunteer assignment (admin only)"""
    assignment = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.assignment_id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Volunteer assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Volunteer assignment deleted successfully"}


@router.get("/volunteer/{volunteer_id}", response_model=List[schemas.VolunteerAssignment])
async def get_assignments_by_volunteer(
    volunteer_id: int,
    db: Session = Depends(get_db)
):
    """Get all assignments for a specific volunteer"""
    assignments = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.volunteer_id == volunteer_id
    ).all()
    return assignments


@router.get("/camp/{camp_id}", response_model=List[schemas.VolunteerAssignment])
async def get_assignments_by_camp(
    camp_id: int,
    db: Session = Depends(get_db)
):
    """Get all assignments for a specific camp"""
    assignments = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.camp_id == camp_id
    ).all()
    return assignments