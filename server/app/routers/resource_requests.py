from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_coordinator_or_admin, get_admin_user

router = APIRouter(prefix="/api/resource-requests", tags=["resource-requests"])


@router.get("/", response_model=List[schemas.ResourceRequest])
async def get_resource_requests(
    skip: int = 0, 
    limit: int = 100, 
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all resource requests, optionally filtered by status"""
    query = db.query(models.ResourceRequest)
    
    if status_filter:
        query = query.filter(models.ResourceRequest.status == status_filter)
    
    requests = query.offset(skip).limit(limit).all()
    return requests


@router.get("/{request_id}", response_model=schemas.ResourceRequest)
async def get_resource_request(
    request_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get resource request by ID"""
    request = db.query(models.ResourceRequest).filter(models.ResourceRequest.request_id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Resource request not found")
    return request


@router.post("/", response_model=schemas.ResourceRequest, status_code=status.HTTP_201_CREATED)
async def create_resource_request(
    request_data: schemas.ResourceRequestCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Create a new resource request (camp coordinator or admin)"""
    # Verify camp exists
    camp = db.query(models.Camp).filter(models.Camp.camp_id == request_data.camp_id).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Camp not found")
    
    # For coordinators, ensure they can only create requests for their assigned camp
    if current_user.role == models.UserRole.COORDINATOR:
        if current_user.assigned_camp_id != request_data.camp_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create requests for assigned camp"
            )
    
    request_dict = request_data.dict()
    request_dict["coordinator_id"] = current_user.user_id
    
    db_request = models.ResourceRequest(**request_dict)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request


@router.put("/{request_id}", response_model=schemas.ResourceRequest)
async def update_resource_request(
    request_id: int, 
    request_update: schemas.ResourceRequestUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_coordinator_or_admin)
):
    """Update resource request (camp coordinator or admin)"""
    request = db.query(models.ResourceRequest).filter(models.ResourceRequest.request_id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Resource request not found")
    
    update_data = request_update.dict(exclude_unset=True)
    
    # Verify camp exists if camp_id is being updated
    if "camp_id" in update_data and update_data["camp_id"]:
        camp = db.query(models.Camp).filter(models.Camp.camp_id == update_data["camp_id"]).first()
        if not camp:
            raise HTTPException(status_code=404, detail="Camp not found")
    
    # Verify disaster exists if disaster_id is being updated
    if "disaster_id" in update_data and update_data["disaster_id"]:
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == update_data["disaster_id"]).first()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
    
    for field, value in update_data.items():
        setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    return request


@router.delete("/{request_id}")
async def delete_resource_request(
    request_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Delete resource request (admin only)"""
    request = db.query(models.ResourceRequest).filter(models.ResourceRequest.request_id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Resource request not found")
    
    db.delete(request)
    db.commit()
    return {"message": "Resource request deleted successfully"}


@router.put("/{request_id}/approve", response_model=schemas.ResourceRequest)
async def approve_resource_request(
    request_id: int,
    quantity_approved: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Approve resource request (admin only)"""
    request = db.query(models.ResourceRequest).filter(models.ResourceRequest.request_id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Resource request not found")
    
    request.status = models.RequestStatus.APPROVED
    request.quantity_approved = quantity_approved
    request.approved_by = current_user.user_id
    request.approved_at = db.func.now()
    if notes:
        request.notes = notes
    
    db.commit()
    db.refresh(request)
    return request


@router.put("/{request_id}/reject")
async def reject_resource_request(
    request_id: int,
    notes: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Reject resource request (admin only)"""
    request = db.query(models.ResourceRequest).filter(models.ResourceRequest.request_id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Resource request not found")
    
    request.status = models.RequestStatus.REJECTED
    request.approved_by = current_user.user_id
    request.approved_at = db.func.now()
    request.notes = notes
    
    db.commit()
    db.refresh(request)
    return {"message": "Resource request rejected"}


@router.put("/{request_id}/fulfill")
async def fulfill_resource_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_admin_user)
):
    """Mark resource request as fulfilled (admin only)"""
    request = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.request_id == request_id,
        models.ResourceRequest.status == models.RequestStatus.APPROVED
    ).first()
    
    if request is None:
        raise HTTPException(status_code=404, detail="Approved resource request not found")
    
    request.status = models.RequestStatus.FULFILLED
    
    db.commit()
    db.refresh(request)
    return {"message": "Resource request marked as fulfilled"}