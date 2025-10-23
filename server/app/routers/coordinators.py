"""
Camp Coordinator API endpoints
Handles camp coordinator management and assignments
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.auth import get_current_active_user

from app.database import get_db
from app.models import CampCoordinator, User, UserRole, Camp, ResourceRequest
from app.schemas import (
    CampCoordinatorCreate, CampCoordinator as CampCoordinatorResponse,
    CampCoordinatorUpdate, ResourceRequestResponse
)

router = APIRouter(prefix="/coordinators", tags=["coordinators"])

@router.post("/", response_model=CampCoordinatorResponse)
def create_camp_coordinator(
    coordinator_data: CampCoordinatorCreate,
    db: Session = Depends(get_db)
):
    """
    Assign a user as a camp coordinator
    Only users with CAMP_COORDINATOR role can be assigned
    """
    
    # Validate user exists and has correct role
    user = db.query(User).filter(
        User.user_id == coordinator_data.user_id,
        User.role == UserRole.CAMP_COORDINATOR,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not a camp coordinator"
        )
    
    # Validate camp exists
    camp = db.query(Camp).filter(Camp.camp_id == coordinator_data.camp_id).first()
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp not found"
        )
    
    # Check if user already has an active coordinator assignment (one coordinator per user)
    existing_coordinator = db.query(CampCoordinator).filter(
        and_(
            CampCoordinator.user_id == coordinator_data.user_id,
            CampCoordinator.is_active == True
        )
    ).first()
    
    if existing_coordinator:
        existing_camp = db.query(Camp).filter(Camp.camp_id == existing_coordinator.camp_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is already assigned as coordinator for camp '{existing_camp.name}'. Each coordinator can only manage one camp."
        )
    
    # Check if camp already has a coordinator
    existing_camp_coordinator = db.query(CampCoordinator).filter(
        and_(
            CampCoordinator.camp_id == coordinator_data.camp_id,
            CampCoordinator.is_active == True
        )
    ).first()
    
    if existing_camp_coordinator:
        existing_user = db.query(User).filter(User.user_id == existing_camp_coordinator.user_id).first()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Camp already has a coordinator assigned: {existing_user.full_name}"
        )
    
    # Create coordinator assignment
    db_coordinator = CampCoordinator(**coordinator_data.dict())
    db.add(db_coordinator)
    db.commit()
    db.refresh(db_coordinator)
    
    return db_coordinator

@router.get("/", response_model=List[CampCoordinatorResponse])
def get_coordinators(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    camp_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all camp coordinators with optional filtering"""
    
    query = db.query(CampCoordinator)
    
    if active_only:
        query = query.filter(CampCoordinator.is_active == True)
    
    if camp_id:
        query = query.filter(CampCoordinator.camp_id == camp_id)
    
    if user_id:
        query = query.filter(CampCoordinator.user_id == user_id)
    
    coordinators = query.offset(skip).limit(limit).all()
    return coordinators


@router.get("/my-camp")
def get_my_camp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current coordinator's camp information"""
    if current_user.role != UserRole.CAMP_COORDINATOR:
        raise HTTPException(status_code=403, detail="Camp Coordinator access required")
    
    # Get coordinator record
    coordinator = db.query(CampCoordinator).filter(
        CampCoordinator.user_id == current_user.user_id,
        CampCoordinator.is_active == True
    ).first()
    
    if not coordinator:
        raise HTTPException(status_code=404, detail="Coordinator assignment not found")
    
    # Get camp information
    camp = db.query(Camp).filter(Camp.camp_id == coordinator.camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    return {
        "camp_id": camp.camp_id,
        "camp_name": camp.name,
        "camp_location": camp.location,
        "disaster_id": camp.disaster_id,
        "coordinator_id": coordinator.coordinator_id
    }


@router.get("/{coordinator_id}", response_model=CampCoordinatorResponse)
def get_coordinator(coordinator_id: int, db: Session = Depends(get_db)):
    """Get a specific coordinator by ID"""
    
    coordinator = db.query(CampCoordinator).filter(
        CampCoordinator.coordinator_id == coordinator_id
    ).first()
    
    if not coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordinator not found"
        )
    
    return coordinator

@router.put("/{coordinator_id}", response_model=CampCoordinatorResponse)
def update_coordinator(
    coordinator_id: int,
    coordinator_update: CampCoordinatorUpdate,
    db: Session = Depends(get_db)
):
    """Update coordinator details"""
    
    db_coordinator = db.query(CampCoordinator).filter(
        CampCoordinator.coordinator_id == coordinator_id
    ).first()
    
    if not db_coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordinator not found"
        )
    
    # Update fields
    update_data = coordinator_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_coordinator, field, value)
    
    db.commit()
    db.refresh(db_coordinator)
    
    return db_coordinator

@router.delete("/{coordinator_id}")
def deactivate_coordinator(
    coordinator_id: int,
    db: Session = Depends(get_db)
):
    """Deactivate a coordinator (soft delete)"""
    
    db_coordinator = db.query(CampCoordinator).filter(
        CampCoordinator.coordinator_id == coordinator_id
    ).first()
    
    if not db_coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordinator not found"
        )
    
    db_coordinator.is_active = False
    db.commit()
    
    return {"message": "Coordinator deactivated successfully"}

@router.get("/{coordinator_id}/requests", response_model=List[ResourceRequestResponse])
def get_coordinator_resource_requests(
    coordinator_id: int,
    db: Session = Depends(get_db)
):
    """Get all resource requests made by a specific coordinator"""
    
    # Verify coordinator exists
    coordinator = db.query(CampCoordinator).filter(
        CampCoordinator.coordinator_id == coordinator_id
    ).first()
    
    if not coordinator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coordinator not found"
        )
    
    requests = db.query(ResourceRequest).filter(
        ResourceRequest.requested_by_coordinator_id == coordinator_id
    ).order_by(ResourceRequest.request_date.desc()).all()
    
    return requests

@router.get("/user/{user_id}/camps")
def get_user_coordinated_camps(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all camps coordinated by a specific user"""
    
    # Verify user exists and is a coordinator
    user = db.query(User).filter(
        User.user_id == user_id,
        User.role == UserRole.CAMP_COORDINATOR,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not a coordinator"
        )
    
    coordinators = db.query(CampCoordinator).filter(
        and_(
            CampCoordinator.user_id == user_id,
            CampCoordinator.is_active == True
        )
    ).all()
    
    # Get camp details for each coordination
    camps_data = []
    for coordinator in coordinators:
        camp = db.query(Camp).filter(Camp.camp_id == coordinator.camp_id).first()
        if camp:
            camps_data.append({
                "coordinator_id": coordinator.coordinator_id,
                "camp": camp,
                "assigned_date": coordinator.assigned_date,
                "responsibilities": coordinator.responsibilities,
                "contact_hours": coordinator.contact_hours
            })
    
    return camps_data

@router.get("/camp/{camp_id}/coordinators", response_model=List[CampCoordinatorResponse])
def get_camp_coordinators(
    camp_id: int,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all coordinators for a specific camp"""
    
    # Verify camp exists
    camp = db.query(Camp).filter(Camp.camp_id == camp_id).first()
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp not found"
        )
    
    query = db.query(CampCoordinator).filter(CampCoordinator.camp_id == camp_id)
    
    if active_only:
        query = query.filter(CampCoordinator.is_active == True)
    
    coordinators = query.all()
    return coordinators

@router.get("/users/available")
def get_available_coordinator_users(db: Session = Depends(get_db)):
    """Get users with coordinator role who are not currently assigned to a camp"""
    
    # Get all users with coordinator role
    coordinator_users = db.query(User).filter(
        User.role == UserRole.CAMP_COORDINATOR,
        User.is_active == True
    ).all()
    
    # Get currently assigned coordinator user IDs
    assigned_user_ids = db.query(CampCoordinator.user_id).filter(
        CampCoordinator.is_active == True
    ).all()
    assigned_user_ids = [uid[0] for uid in assigned_user_ids]
    
    # Filter out assigned coordinators
    available_coordinators = [
        {
            "user_id": user.user_id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email
        }
        for user in coordinator_users 
        if user.user_id not in assigned_user_ids
    ]
    
    return available_coordinators

@router.get("/users/all")
def get_all_coordinator_users(db: Session = Depends(get_db)):
    """Get all users with coordinator role"""
    
    coordinator_users = db.query(User).filter(
        User.role == UserRole.CAMP_COORDINATOR,
        User.is_active == True
    ).all()
    
    return [
        {
            "user_id": user.user_id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email
        }
        for user in coordinator_users
    ]

@router.get("/user/{user_id}/requests", response_model=List[ResourceRequestResponse])
def get_coordinator_user_requests(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all resource requests made by a coordinator user"""
    
    # Verify user exists and is a coordinator
    user = db.query(User).filter(
        User.user_id == user_id,
        User.role == UserRole.CAMP_COORDINATOR,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not a coordinator"
        )
    
    # Get all coordinator assignments for this user
    coordinators = db.query(CampCoordinator).filter(
        and_(
            CampCoordinator.user_id == user_id,
            CampCoordinator.is_active == True
        )
    ).all()
    
    # Get all requests made by any of these coordinator assignments
    coordinator_ids = [c.coordinator_id for c in coordinators]
    
    if not coordinator_ids:
        return []
    
    requests = db.query(ResourceRequest).filter(
        ResourceRequest.requested_by_coordinator_id.in_(coordinator_ids)
    ).order_by(ResourceRequest.request_date.desc()).all()
    
    return requests


