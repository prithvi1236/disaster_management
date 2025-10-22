"""
Resource Request API endpoints
Handles resource requests from camp coordinators and admins
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.database import get_db
from app.models import (
    ResourceRequest, RequestStatus, CampCoordinator, 
    User, UserRole, Camp, Disaster
)
from app.schemas import (
    ResourceRequestCreate, ResourceRequestResponse, 
    ResourceRequestUpdate, ResourceRequestStatusUpdate
)
from app.auth import get_current_active_user

router = APIRouter(prefix="/resource-requests", tags=["resource-requests"])

@router.post("/", response_model=ResourceRequestResponse)
def create_resource_request(
    request_data: ResourceRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new resource request
    Can be created by camp coordinators or admins
    """
    
    # Validate coordinator if provided
    if request_data.requested_by_coordinator_id:
        coordinator = db.query(CampCoordinator).filter(
            CampCoordinator.coordinator_id == request_data.requested_by_coordinator_id,
            CampCoordinator.is_active == True
        ).first()
        
        if not coordinator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Camp coordinator not found or inactive"
            )
        
        # Validate that coordinator manages the specified camp
        if request_data.camp_id and coordinator.camp_id != request_data.camp_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Coordinator can only request resources for their assigned camp"
            )
    
    # Validate user if provided
    if request_data.requested_by_user_id:
        user = db.query(User).filter(
            User.user_id == request_data.requested_by_user_id,
            User.is_active == True
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or inactive"
            )
    
    # Validate camp exists
    if request_data.camp_id:
        camp = db.query(Camp).filter(Camp.camp_id == request_data.camp_id).first()
        if not camp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Camp not found"
            )
    
    # Validate disaster exists
    if request_data.disaster_id:
        disaster = db.query(Disaster).filter(Disaster.disaster_id == request_data.disaster_id).first()
        if not disaster:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disaster not found"
            )
    
    # Create the resource request
    db_request = ResourceRequest(**request_data.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.get("/", response_model=List[ResourceRequestResponse])
def get_resource_requests(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[RequestStatus] = None,
    priority_filter: Optional[str] = None,
    resource_type_filter: Optional[str] = None,
    camp_id: Optional[int] = None,
    disaster_id: Optional[int] = None,
    coordinator_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get resource requests with optional filtering
    """
    query = db.query(ResourceRequest)
    
    # Apply filters
    if status_filter:
        query = query.filter(ResourceRequest.status == status_filter)
    
    if priority_filter:
        query = query.filter(ResourceRequest.priority_level == priority_filter)
    
    if resource_type_filter:
        query = query.filter(ResourceRequest.resource_type == resource_type_filter)
    
    if camp_id:
        query = query.filter(ResourceRequest.camp_id == camp_id)
    
    if disaster_id:
        query = query.filter(ResourceRequest.disaster_id == disaster_id)
    
    if coordinator_id:
        query = query.filter(ResourceRequest.requested_by_coordinator_id == coordinator_id)
    
    # Order by priority and date
    priority_order = {
        'Critical': 1,
        'High': 2,
        'Medium': 3,
        'Low': 4
    }
    
    requests = query.offset(skip).limit(limit).all()
    
    # Sort by priority and then by date
    requests.sort(key=lambda x: (
        priority_order.get(x.priority_level, 5),
        x.request_date
    ))
    
    return requests

@router.get("/{request_id}", response_model=ResourceRequestResponse)
def get_resource_request(request_id: int, db: Session = Depends(get_db)):
    """Get a specific resource request by ID"""
    
    request = db.query(ResourceRequest).filter(
        ResourceRequest.request_id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    return request

@router.put("/{request_id}", response_model=ResourceRequestResponse)
def update_resource_request(
    request_id: int,
    request_update: ResourceRequestUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a resource request
    Only coordinators can update their own requests, admins can update any
    """
    
    db_request = db.query(ResourceRequest).filter(
        ResourceRequest.request_id == request_id
    ).first()
    
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    # Update fields
    update_data = request_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_request, field, value)
    
    db.commit()
    db.refresh(db_request)
    
    return db_request

@router.patch("/{request_id}/status", response_model=ResourceRequestResponse)
def update_request_status(
    request_id: int,
    status_update: ResourceRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update the status of a resource request (Admin only)
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_request = db.query(ResourceRequest).filter(
        ResourceRequest.request_id == request_id
    ).first()
    
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    # Update status and related fields
    db_request.status = status_update.status
    db_request.approved_by = current_user.user_id
    
    if status_update.status == RequestStatus.APPROVED:
        db_request.approved_date = datetime.now()
    elif status_update.status == RequestStatus.FULFILLED:
        db_request.fulfilled_date = datetime.now()
    
    if status_update.notes:
        db_request.notes = status_update.notes
    
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("/admin/pending", response_model=List[ResourceRequestResponse])
def get_pending_requests_for_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all pending resource requests for admin review"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pending_requests = db.query(ResourceRequest).filter(
        ResourceRequest.status == RequestStatus.PENDING
    ).order_by(ResourceRequest.request_date.asc()).all()
    
    return pending_requests

@router.get("/coordinator/{coordinator_id}", response_model=List[ResourceRequestResponse])
def get_coordinator_requests(
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
            detail="Camp coordinator not found"
        )
    
    requests = db.query(ResourceRequest).filter(
        ResourceRequest.requested_by_coordinator_id == coordinator_id
    ).order_by(ResourceRequest.request_date.desc()).all()
    
    return requests

@router.get("/camp/{camp_id}", response_model=List[ResourceRequestResponse])
def get_camp_requests(
    camp_id: int,
    db: Session = Depends(get_db)
):
    """Get all resource requests for a specific camp"""
    
    # Verify camp exists
    camp = db.query(Camp).filter(Camp.camp_id == camp_id).first()
    
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp not found"
        )
    
    requests = db.query(ResourceRequest).filter(
        ResourceRequest.camp_id == camp_id
    ).order_by(ResourceRequest.request_date.desc()).all()
    
    return requests

@router.delete("/{request_id}")
def delete_resource_request(
    request_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a resource request
    Only pending requests can be deleted
    """
    
    db_request = db.query(ResourceRequest).filter(
        ResourceRequest.request_id == request_id
    ).first()
    
    if not db_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    if db_request.status != RequestStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be deleted"
        )
    
    db.delete(db_request)
    db.commit()
    
    return {"message": "Resource request deleted successfully"}