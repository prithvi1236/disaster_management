"""
Statistics and dashboard data endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user

router = APIRouter()

@router.get("/statistics/dashboard", response_model=schemas.DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get dashboard statistics"""
    
    # Total disasters
    total_disasters = db.query(models.Disaster).count()
    
    # Active disasters
    active_disasters = db.query(models.Disaster).filter(
        models.Disaster.status.in_(["Active", "Ongoing"])
    ).count()
    
    # Total camps
    total_camps = db.query(models.Camp).count()
    
    # Total volunteers
    total_volunteers = db.query(models.Volunteer).count()
    
    # Total donations
    total_donations = db.query(models.Donation).count()
    
    # Total donation amount
    total_amount = db.query(func.sum(models.Donation.amount)).scalar() or 0.0
    
    # Pending resource requests
    pending_requests = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.status == models.RequestStatus.PENDING
    ).count()
    
    return schemas.DashboardStats(
        total_disasters=total_disasters,
        active_disasters=active_disasters,
        total_camps=total_camps,
        total_volunteers=total_volunteers,
        total_donations=total_donations,
        total_donation_amount=total_amount,
        pending_resource_requests=pending_requests
    )

@router.get("/statistics/disasters", response_model=List[schemas.DisasterStats])
async def get_disaster_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get statistics for each disaster"""
    
    disasters = db.query(models.Disaster).all()
    disaster_stats = []
    
    for disaster in disasters:
        # Count camps for this disaster
        camp_count = db.query(models.Camp).filter(
            models.Camp.disaster_id == disaster.disaster_id
        ).count()
        
        # Count volunteers for this disaster
        volunteer_count = db.query(models.Volunteer).filter(
            models.Volunteer.disaster_id == disaster.disaster_id
        ).count()
        
        # Count donations for this disaster
        donation_count = db.query(models.Donation).filter(
            models.Donation.disaster_id == disaster.disaster_id
        ).count()
        
        # Sum donation amounts for this disaster
        donation_amount = db.query(func.sum(models.Donation.amount)).filter(
            models.Donation.disaster_id == disaster.disaster_id
        ).scalar() or 0.0
        
        # Count pending requests for this disaster
        pending_requests = db.query(models.ResourceRequest).filter(
            models.ResourceRequest.disaster_id == disaster.disaster_id,
            models.ResourceRequest.status == models.RequestStatus.PENDING
        ).count()
        
        disaster_stats.append(schemas.DisasterStats(
            disaster_id=disaster.disaster_id,
            disaster_name=disaster.name,
            total_camps=camp_count,
            total_volunteers=volunteer_count,
            total_donations=donation_count,
            donation_amount=donation_amount,
            pending_requests=pending_requests
        ))
    
    return disaster_stats

@router.get("/statistics/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get recent activity feed"""
    
    # Recent donations
    recent_donations = db.query(models.Donation).order_by(
        models.Donation.created_at.desc()
    ).limit(limit//2).all()
    
    # Recent volunteers
    recent_volunteers = db.query(models.Volunteer).order_by(
        models.Volunteer.created_at.desc()
    ).limit(limit//2).all()
    
    # Recent resource requests
    recent_requests = db.query(models.ResourceRequest).order_by(
        models.ResourceRequest.created_at.desc()
    ).limit(limit//2).all()
    
    activity = []
    
    for donation in recent_donations:
        activity.append({
            "type": "donation",
            "message": f"New donation: {donation.donation_type} from {donation.donor_name or 'Anonymous'}",
            "timestamp": donation.created_at,
            "id": donation.donation_id
        })
    
    for volunteer in recent_volunteers:
        activity.append({
            "type": "volunteer",
            "message": f"New volunteer registered: {volunteer.name}",
            "timestamp": volunteer.created_at,
            "id": volunteer.volunteer_id
        })
    
    for request in recent_requests:
        activity.append({
            "type": "request",
            "message": f"New resource request: {request.title}",
            "timestamp": request.created_at,
            "id": request.request_id
        })
    
    # Sort by timestamp and limit
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity[:limit]