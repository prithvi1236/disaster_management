from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_coordinator_user, get_coordinator_or_admin

router = APIRouter(prefix="/api/coordinator", tags=["coordinator"])


@router.get("/dashboard")
def get_coordinator_dashboard(
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Get coordinator dashboard data for their assigned camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    # Get camp details
    camp = db.query(models.Camp).filter(
        models.Camp.camp_id == current_user.assigned_camp_id
    ).first()
    
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned camp not found"
        )
    
    # Get camp statistics
    total_volunteers = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.camp_id == camp.camp_id,
        models.VolunteerAssignment.status.in_([
            models.AssignmentStatus.APPROVED,
            models.AssignmentStatus.ACTIVE
        ])
    ).count()
    
    pending_volunteers = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.camp_id == camp.camp_id,
        models.VolunteerAssignment.status == models.AssignmentStatus.PENDING
    ).count()
    
    pending_resources = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.camp_id == camp.camp_id,
        models.ResourceRequest.status == models.RequestStatus.PENDING
    ).count()
    
    return {
        "camp": camp,
        "statistics": {
            "total_volunteers": total_volunteers,
            "pending_volunteers": pending_volunteers,
            "pending_resource_requests": pending_resources,
            "occupancy_rate": (camp.current_occupancy / camp.capacity * 100) if camp.capacity > 0 else 0
        }
    }


@router.put("/camp")
def update_assigned_camp(
    camp_update: schemas.CampUpdate,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Update coordinator's assigned camp details."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    camp = db.query(models.Camp).filter(
        models.Camp.camp_id == current_user.assigned_camp_id
    ).first()
    
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned camp not found"
        )
    
    # Update camp fields (excluding sensitive fields like coordinator_id)
    update_data = camp_update.dict(exclude_unset=True)
    allowed_fields = ['current_occupancy', 'status', 'resources_needed', 'contact_info', 'facilities']
    
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(camp, field, value)
    
    db.commit()
    db.refresh(camp)
    
    return camp


# Resource Request Management
@router.post("/resources/request", response_model=schemas.ResourceRequest)
def create_resource_request(
    request: schemas.ResourceRequestCreate,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Create a resource request for coordinator's assigned camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    # Ensure the request is for the coordinator's assigned camp
    if request.camp_id != current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only create requests for assigned camp"
        )
    
    request_data = request.dict()
    request_data["coordinator_id"] = current_user.user_id
    
    db_request = models.ResourceRequest(**request_data)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return db_request


@router.get("/resources/requests", response_model=List[schemas.ResourceRequest])
def get_camp_resource_requests(
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Get all resource requests for coordinator's assigned camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    requests = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.camp_id == current_user.assigned_camp_id
    ).order_by(models.ResourceRequest.requested_at.desc()).all()
    
    return requests


@router.put("/resources/{request_id}")
def update_resource_request(
    request_id: int,
    request_update: schemas.ResourceRequestUpdate,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Update a resource request (coordinator can only update their own camp's requests)."""
    request = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.request_id == request_id,
        models.ResourceRequest.coordinator_id == current_user.user_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found or access denied"
        )
    
    # Only allow updating certain fields
    update_data = request_update.dict(exclude_unset=True)
    allowed_fields = ['resource_type', 'quantity_requested', 'urgency', 'description']
    
    for field, value in update_data.items():
        if field in allowed_fields and request.status == models.RequestStatus.PENDING:
            setattr(request, field, value)
    
    db.commit()
    db.refresh(request)
    
    return request


# Volunteer Management
@router.get("/volunteers", response_model=List[schemas.VolunteerAssignment])
def get_camp_volunteers(
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Get all volunteers assigned to coordinator's camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    assignments = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.camp_id == current_user.assigned_camp_id
    ).all()
    
    return assignments


@router.post("/volunteers/approve/{assignment_id}")
def approve_volunteer_assignment(
    assignment_id: int,
    assigned_tasks: Optional[List[str]] = None,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Approve a volunteer assignment for coordinator's camp."""
    assignment = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.assignment_id == assignment_id,
        models.VolunteerAssignment.camp_id == current_user.assigned_camp_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer assignment not found or access denied"
        )
    
    assignment.status = models.AssignmentStatus.APPROVED
    if assigned_tasks:
        assignment.assigned_tasks = assigned_tasks
    
    db.commit()
    db.refresh(assignment)
    
    return {"message": "Volunteer assignment approved", "assignment": assignment}


@router.post("/volunteers/reject/{assignment_id}")
def reject_volunteer_assignment(
    assignment_id: int,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Reject a volunteer assignment for coordinator's camp."""
    assignment = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.assignment_id == assignment_id,
        models.VolunteerAssignment.camp_id == current_user.assigned_camp_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer assignment not found or access denied"
        )
    
    assignment.status = models.AssignmentStatus.REJECTED
    
    db.commit()
    db.refresh(assignment)
    
    return {"message": "Volunteer assignment rejected"}


@router.put("/volunteers/{assignment_id}")
def update_volunteer_assignment(
    assignment_id: int,
    assignment_update: schemas.VolunteerAssignmentUpdate,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Update volunteer assignment details."""
    assignment = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.assignment_id == assignment_id,
        models.VolunteerAssignment.camp_id == current_user.assigned_camp_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Volunteer assignment not found or access denied"
        )
    
    update_data = assignment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)
    
    db.commit()
    db.refresh(assignment)
    
    return assignment


# Daily Reports
@router.post("/reports/daily")
def submit_daily_report(
    report_data: dict,
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Submit daily situation report for coordinator's camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    # For now, we'll store daily reports as notifications
    # In a full implementation, you might want a separate DailyReport model
    
    report_notification = models.Notification(
        sender_id=current_user.user_id,
        camp_id=current_user.assigned_camp_id,
        type=models.NotificationType.CAMP,
        priority=models.NotificationPriority.MEDIUM,
        title=f"Daily Report - {report_data.get('date', 'Today')}",
        message=f"Camp Population: {report_data.get('population', 'N/A')}\n"
                f"Medical Needs: {report_data.get('medical_needs', 'None')}\n"
                f"Resource Status: {report_data.get('resource_status', 'Normal')}\n"
                f"Additional Notes: {report_data.get('notes', 'None')}"
    )
    
    db.add(report_notification)
    db.commit()
    
    return {"message": "Daily report submitted successfully"}


@router.get("/reports/history")
def get_report_history(
    current_user: models.User = Depends(get_coordinator_user),
    db: Session = Depends(get_db)
):
    """Get history of daily reports for coordinator's camp."""
    if not current_user.assigned_camp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No camp assigned to coordinator"
        )
    
    reports = db.query(models.Notification).filter(
        models.Notification.sender_id == current_user.user_id,
        models.Notification.camp_id == current_user.assigned_camp_id,
        models.Notification.type == models.NotificationType.CAMP,
        models.Notification.title.like("Daily Report%")
    ).order_by(models.Notification.sent_at.desc()).all()
    
    return reports