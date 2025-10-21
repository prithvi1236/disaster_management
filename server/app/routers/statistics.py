from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Any
from datetime import datetime, timedelta
import logging
from app.database import get_db
from app import models
from app.models import Disaster, Camp, Donation, User, ResourceRequest, VolunteerAssignment, UserRole
from app.auth_utils import get_current_active_user

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


@router.get("/dashboard")
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics."""
    try:
        # Total counts
        total_disasters = db.query(Disaster).count()
        total_camps = db.query(Camp).count()
        total_donations = db.query(Donation).count()
        total_volunteers = db.query(User).filter(User.role == UserRole.VOLUNTEER).count()
        total_users = db.query(User).count()
        total_resource_requests = db.query(ResourceRequest).count()
        total_assignments = db.query(VolunteerAssignment).count()
        
        # Active counts
        active_disasters = db.query(Disaster).filter(Disaster.status == "Active").count()
        active_volunteers = db.query(User).filter(
            User.role == UserRole.VOLUNTEER,
            User.is_active == True
        ).count()
        
        # Donation statistics
        total_monetary_donations = db.query(func.sum(Donation.amount)).filter(
            Donation.donation_type == "Cash"
        ).scalar() or 0
        
        # Camp occupancy statistics
        camp_stats = db.query(
            func.sum(Camp.capacity).label("total_capacity"),
            func.sum(Camp.current_occupancy).label("total_occupancy")
        ).first()
        
        total_capacity = camp_stats.total_capacity or 0
        total_occupancy = camp_stats.total_occupancy or 0
        occupancy_rate = (total_occupancy / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "totals": {
                "disasters": total_disasters,
                "camps": total_camps,
                "donations": total_donations,
                "volunteers": total_volunteers,
                "users": total_users,
                "resource_requests": total_resource_requests,
                "assignments": total_assignments
            },
            "active": {
                "disasters": active_disasters,
                "volunteers": active_volunteers
            },
            "donations": {
                "total_amount": float(total_monetary_donations),
                "count": total_donations
            },
            "camps": {
                "total_capacity": total_capacity,
                "total_occupancy": total_occupancy,
                "occupancy_rate": round(occupancy_rate, 2)
            }
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_dashboard_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching dashboard statistics")
    except Exception as e:
        logger.error(f"Unexpected error in get_dashboard_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching dashboard statistics")


@router.get("/disasters")
def get_disaster_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get disaster-specific statistics."""
    try:
        # Disasters by status
        status_stats = db.query(
            Disaster.status,
            func.count(Disaster.disaster_id).label("count")
        ).group_by(Disaster.status).all()
        
        # Disasters by type
        type_stats = db.query(
            Disaster.type,
            func.count(Disaster.disaster_id).label("count")
        ).group_by(Disaster.type).all()
        
        # Disasters by severity
        severity_stats = db.query(
            Disaster.severity_level,
            func.count(Disaster.disaster_id).label("count")
        ).group_by(Disaster.severity_level).all()
        
        return {
            "by_status": [{"status": stat.status or "Unknown", "count": stat.count} for stat in status_stats],
            "by_type": [{"type": stat.type or "Unknown", "count": stat.count} for stat in type_stats],
            "by_severity": [{"severity": stat.severity_level or "Unknown", "count": stat.count} for stat in severity_stats]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_disaster_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching disaster statistics")
    except Exception as e:
        logger.error(f"Unexpected error in get_disaster_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching disaster statistics")


@router.get("/donations")
def get_donation_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get donation-specific statistics."""
    try:
        # Donations by type
        type_stats = db.query(
            Donation.donation_type,
            func.count(Donation.donation_id).label("count"),
            func.sum(Donation.amount).label("total_amount")
        ).group_by(Donation.donation_type).all()
        
        # Recent donations (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_donations = db.query(func.count(Donation.donation_id)).filter(
            Donation.created_at >= thirty_days_ago
        ).scalar() or 0
        
        # Donations by status
        status_stats = db.query(
            Donation.status,
            func.count(Donation.donation_id).label("count")
        ).group_by(Donation.status).all()
        
        return {
            "by_type": [
                {
                    "type": stat.donation_type or "Unknown",
                    "count": stat.count,
                    "total_amount": float(stat.total_amount or 0)
                }
                for stat in type_stats
            ],
            "recent_count": recent_donations,
            "by_status": [{"status": stat.status or "Unknown", "count": stat.count} for stat in status_stats]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_donation_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching donation statistics")
    except Exception as e:
        logger.error(f"Unexpected error in get_donation_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching donation statistics")


@router.get("/camps")
def get_camp_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get camp-specific statistics."""
    try:
        # Camp occupancy statistics
        camps = db.query(Camp).all()
        
        occupancy_stats = []
        for camp in camps:
            capacity = camp.capacity or 0
            occupancy = camp.current_occupancy or 0
            occupancy_rate = (occupancy / capacity * 100) if capacity > 0 else 0
            occupancy_stats.append({
                "camp_id": camp.camp_id,
                "name": camp.name or "Unnamed Camp",
                "capacity": capacity,
                "occupancy": occupancy,
                "occupancy_rate": round(occupancy_rate, 2),
                "available_space": max(0, capacity - occupancy)
            })
        
        # Overall statistics
        total_camps = len(camps)
        full_camps = len([camp for camp in camps if (camp.current_occupancy or 0) >= (camp.capacity or 0) and camp.capacity > 0])
        empty_camps = len([camp for camp in camps if (camp.current_occupancy or 0) == 0])
        
        return {
            "total_camps": total_camps,
            "full_camps": full_camps,
            "empty_camps": empty_camps,
            "camp_details": occupancy_stats
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_camp_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching camp statistics")
    except Exception as e:
        logger.error(f"Unexpected error in get_camp_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching camp statistics")


@router.get("/volunteers")
def get_volunteer_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get volunteer-specific statistics."""
    try:
        # Volunteers by active status
        status_stats = db.query(
            User.is_active,
            func.count(User.user_id).label("count")
        ).filter(User.role == UserRole.VOLUNTEER).group_by(User.is_active).all()
        
        # Volunteers by approval status
        approval_stats = db.query(
            User.is_approved,
            func.count(User.user_id).label("count")
        ).filter(User.role == UserRole.VOLUNTEER).group_by(User.is_approved).all()
        
        # Recent volunteers (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_volunteers = db.query(func.count(User.user_id)).filter(
            User.role == UserRole.VOLUNTEER,
            User.created_at >= thirty_days_ago
        ).scalar() or 0
        
        return {
            "by_status": [
                {"status": "active" if stat.is_active else "inactive", "count": stat.count} 
                for stat in status_stats
            ],
            "by_approval": [
                {"approved": bool(stat.is_approved), "count": stat.count} 
                for stat in approval_stats
            ],
            "recent_count": recent_volunteers
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_volunteer_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching volunteer statistics")
    except Exception as e:
        logger.error(f"Unexpected error in get_volunteer_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching volunteer statistics")


@router.get("/recent-activity")
def get_recent_activity(
    db: Session = Depends(get_db), 
    limit: int = 10,
    current_user: models.User = Depends(get_current_active_user)
) -> Dict[str, List[Dict[str, Any]]]:
    """Get recent activity across all entities."""
    try:
        # Validate limit parameter
        if limit < 1 or limit > 100:
            limit = 10
        
        # Recent disasters
        recent_disasters = db.query(Disaster).order_by(desc(Disaster.created_at)).limit(limit).all()
        
        # Recent donations
        recent_donations = db.query(Donation).order_by(desc(Donation.created_at)).limit(limit).all()
        
        # Recent volunteers
        recent_volunteers = db.query(User).filter(User.role == UserRole.VOLUNTEER).order_by(desc(User.created_at)).limit(limit).all()
        
        # Recent camps
        recent_camps = db.query(Camp).order_by(desc(Camp.created_at)).limit(limit).all()
        
        return {
            "disasters": [
                {
                    "id": disaster.disaster_id,
                    "name": disaster.name or "Unnamed Disaster",
                    "type": disaster.type or "Unknown",
                    "location": disaster.location or "Unknown Location",
                    "created_at": disaster.created_at.isoformat() if disaster.created_at else None
                }
                for disaster in recent_disasters
            ],
            "donations": [
                {
                    "id": donation.donation_id,
                    "donor_name": donation.donor_name or "Anonymous",
                    "type": donation.donation_type or "Unknown",
                    "amount": donation.amount,
                    "created_at": donation.created_at.isoformat() if donation.created_at else None
                }
                for donation in recent_donations
            ],
            "volunteers": [
                {
                    "id": volunteer.user_id,
                    "name": volunteer.full_name or "Unknown",
                    "email": volunteer.email or "No email",
                    "skills": volunteer.skills,
                    "created_at": volunteer.created_at.isoformat() if volunteer.created_at else None
                }
                for volunteer in recent_volunteers
            ],
            "camps": [
                {
                    "id": camp.camp_id,
                    "name": camp.name or "Unnamed Camp",
                    "location": camp.location or "Unknown Location",
                    "capacity": camp.capacity or 0,
                    "occupancy": camp.current_occupancy or 0,
                    "created_at": camp.created_at.isoformat() if camp.created_at else None
                }
                for camp in recent_camps
            ]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_recent_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching recent activity")
    except Exception as e:
        logger.error(f"Unexpected error in get_recent_activity: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching recent activity")


@router.get("/chart-data/donations-trend")
def get_donations_trend_chart_data(db: Session = Depends(get_db), days: int = 30) -> Dict[str, Any]:
    """Get donation trend data for charts."""
    try:
        # Validate days parameter
        if days < 1 or days > 365:
            days = 30
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily donation counts and amounts
        daily_stats = db.query(
            func.date(Donation.created_at).label("date"),
            func.count(Donation.donation_id).label("count"),
            func.sum(Donation.amount).label("total_amount")
        ).filter(
            Donation.created_at >= start_date
        ).group_by(
            func.date(Donation.created_at)
        ).order_by("date").all()
        
        return {
            "labels": [stat.date.isoformat() if stat.date else "" for stat in daily_stats],
            "datasets": [
                {
                    "label": "Donation Count",
                    "data": [stat.count for stat in daily_stats]
                },
                {
                    "label": "Total Amount",
                    "data": [float(stat.total_amount or 0) for stat in daily_stats]
                }
            ]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_donations_trend_chart_data: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching donation trend data")
    except Exception as e:
        logger.error(f"Unexpected error in get_donations_trend_chart_data: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching donation trend data")


@router.get("/chart-data/disaster-types")
def get_disaster_types_chart_data(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get disaster types data for pie charts."""
    try:
        type_stats = db.query(
            Disaster.type,
            func.count(Disaster.disaster_id).label("count")
        ).group_by(Disaster.type).all()
        
        return {
            "labels": [stat.type or "Unknown" for stat in type_stats],
            "data": [stat.count for stat in type_stats]
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error in get_disaster_types_chart_data: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error occurred while fetching disaster types chart data")
    except Exception as e:
        logger.error(f"Unexpected error in get_disaster_types_chart_data: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching disaster types chart data")