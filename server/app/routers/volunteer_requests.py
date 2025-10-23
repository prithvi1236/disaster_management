from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user

router = APIRouter()


@router.post("/volunteer-requests", response_model=schemas.VolunteerRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer_request(
    request: schemas.VolunteerRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new volunteer request (Camp Coordinator only)"""
    if current_user.role != models.UserRole.CAMP_COORDINATOR:
        raise HTTPException(status_code=403, detail="Camp Coordinator access required")
    
    # Get coordinator record
    coordinator = db.query(models.CampCoordinator).filter(
        models.CampCoordinator.user_id == current_user.user_id,
        models.CampCoordinator.is_active == True
    ).first()
    
    if not coordinator:
        raise HTTPException(status_code=403, detail="User is not an active camp coordinator")
    
    # Verify the coordinator is requesting for their assigned camp
    if request.camp_id != coordinator.camp_id:
        raise HTTPException(
            status_code=403,
            detail="Coordinator can only request volunteers for their assigned camp"
        )
    
    # Verify disaster and camp exist
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == request.disaster_id).first()
    if not disaster:
        raise HTTPException(status_code=404, detail="Disaster not found")
    
    camp = db.query(models.Camp).filter(models.Camp.camp_id == request.camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    # Create volunteer request
    request_data = request.dict()
    request_data['requested_by_coordinator_id'] = coordinator.coordinator_id
    
    db_request = models.VolunteerRequest(**request_data)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("/volunteer-requests", response_model=List[schemas.VolunteerRequestResponse])
async def get_volunteer_requests(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[models.RequestStatus] = None,
    priority_filter: Optional[str] = None,
    volunteer_type_filter: Optional[str] = None,
    camp_id: Optional[int] = None,
    disaster_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get volunteer requests with optional filters"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.CAMP_COORDINATOR]:
        raise HTTPException(status_code=403, detail="Admin or Coordinator access required")
    
    query = db.query(models.VolunteerRequest)
    
    # If coordinator, only show their requests
    if current_user.role == models.UserRole.CAMP_COORDINATOR:
        coordinator = db.query(models.CampCoordinator).filter(
            models.CampCoordinator.user_id == current_user.user_id,
            models.CampCoordinator.is_active == True
        ).first()
        
        if coordinator:
            query = query.filter(models.VolunteerRequest.requested_by_coordinator_id == coordinator.coordinator_id)
        else:
            return []  # No coordinator record found
    
    # Apply filters
    if status_filter:
        query = query.filter(models.VolunteerRequest.status == status_filter)
    
    if priority_filter:
        query = query.filter(models.VolunteerRequest.priority_level == priority_filter)
    
    if volunteer_type_filter:
        query = query.filter(models.VolunteerRequest.volunteer_type == volunteer_type_filter)
    
    if camp_id:
        query = query.filter(models.VolunteerRequest.camp_id == camp_id)
    
    if disaster_id:
        query = query.filter(models.VolunteerRequest.disaster_id == disaster_id)
    
    requests = query.order_by(models.VolunteerRequest.request_date.desc()).offset(skip).limit(limit).all()
    return requests


@router.get("/volunteer-requests/{request_id}", response_model=schemas.VolunteerRequestResponse)
async def get_volunteer_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific volunteer request"""
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.CAMP_COORDINATOR]:
        raise HTTPException(status_code=403, detail="Admin or Coordinator access required")
    
    request = db.query(models.VolunteerRequest).filter(models.VolunteerRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Volunteer request not found")
    
    # If coordinator, verify they own this request
    if current_user.role == models.UserRole.CAMP_COORDINATOR:
        coordinator = db.query(models.CampCoordinator).filter(
            models.CampCoordinator.user_id == current_user.user_id,
            models.CampCoordinator.is_active == True
        ).first()
        
        if not coordinator or request.requested_by_coordinator_id != coordinator.coordinator_id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return request


@router.put("/volunteer-requests/{request_id}", response_model=schemas.VolunteerRequestResponse)
async def update_volunteer_request(
    request_id: int,
    request_update: schemas.VolunteerRequestUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update volunteer request (Admin can approve/reject, Coordinator can edit their own)"""
    request = db.query(models.VolunteerRequest).filter(models.VolunteerRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Volunteer request not found")
    
    # Check permissions
    if current_user.role == models.UserRole.ADMIN:
        # Admin can update any request
        pass
    elif current_user.role == models.UserRole.CAMP_COORDINATOR:
        # Coordinator can only update their own pending requests
        coordinator = db.query(models.CampCoordinator).filter(
            models.CampCoordinator.user_id == current_user.user_id,
            models.CampCoordinator.is_active == True
        ).first()
        
        if not coordinator or request.requested_by_coordinator_id != coordinator.coordinator_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if request.status != models.RequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Can only edit pending requests")
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update fields
    update_data = request_update.dict(exclude_unset=True)
    
    # Handle status changes (admin only)
    if "status" in update_data and current_user.role == models.UserRole.ADMIN:
        if update_data["status"] in [models.RequestStatus.APPROVED, models.RequestStatus.REJECTED]:
            request.approved_by = current_user.user_id
            request.approved_date = datetime.now()
        elif update_data["status"] == models.RequestStatus.FULFILLED:
            request.fulfilled_date = datetime.now()
    
    for field, value in update_data.items():
        setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    return request


@router.delete("/volunteer-requests/{request_id}")
async def delete_volunteer_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete volunteer request (Coordinator can delete their own pending requests)"""
    request = db.query(models.VolunteerRequest).filter(models.VolunteerRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Volunteer request not found")
    
    # Check permissions
    if current_user.role == models.UserRole.CAMP_COORDINATOR:
        coordinator = db.query(models.CampCoordinator).filter(
            models.CampCoordinator.user_id == current_user.user_id,
            models.CampCoordinator.is_active == True
        ).first()
        
        if not coordinator or request.requested_by_coordinator_id != coordinator.coordinator_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if request.status != models.RequestStatus.PENDING:
            raise HTTPException(status_code=400, detail="Can only delete pending requests")
    elif current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(request)
    db.commit()
    return {"message": "Volunteer request deleted successfully"}