from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_current_active_user, get_user_or_higher

router = APIRouter(prefix="/api/user", tags=["user"])


# Public Camp Information
@router.get("/camps/available", response_model=List[schemas.Camp])
def get_available_camps(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get camps that are accepting volunteers."""
    camps = db.query(models.Camp).filter(
        models.Camp.status == models.CampStatus.ACTIVE,
        models.Camp.current_occupancy < models.Camp.capacity
    ).all()
    return camps


@router.get("/camps/needs")
def get_camp_needs(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """View public camp resource needs."""
    # Get pending resource requests for all active camps
    needs = db.query(
        models.ResourceRequest.camp_id,
        models.Camp.name.label('camp_name'),
        models.ResourceRequest.resource_type,
        models.ResourceRequest.quantity_requested,
        models.ResourceRequest.urgency,
        models.ResourceRequest.description
    ).join(
        models.Camp, models.ResourceRequest.camp_id == models.Camp.camp_id
    ).filter(
        models.ResourceRequest.status == models.RequestStatus.PENDING,
        models.Camp.status == models.CampStatus.ACTIVE
    ).all()
    
    return [
        {
            "camp_id": need.camp_id,
            "camp_name": need.camp_name,
            "resource_type": need.resource_type,
            "quantity_needed": need.quantity_requested,
            "urgency": need.urgency.value,
            "description": need.description
        }
        for need in needs
    ]


# Volunteer Functions
@router.post("/volunteer/apply")
def apply_to_volunteer(
    camp_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Apply to volunteer at a specific camp."""
    if current_user.role not in [models.UserRole.VOLUNTEER, models.UserRole.DONOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only volunteers and donors can apply to volunteer"
        )
    
    # Check if camp exists and is active
    camp = db.query(models.Camp).filter(
        models.Camp.camp_id == camp_id,
        models.Camp.status == models.CampStatus.ACTIVE
    ).first()
    
    if not camp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camp not found or not accepting volunteers"
        )
    
    # Check if user already has an application for this camp
    existing_assignment = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.volunteer_id == current_user.user_id,
        models.VolunteerAssignment.camp_id == camp_id,
        models.VolunteerAssignment.status.in_([
            models.AssignmentStatus.PENDING,
            models.AssignmentStatus.APPROVED,
            models.AssignmentStatus.ACTIVE
        ])
    ).first()
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active application or assignment for this camp"
        )
    
    # Create volunteer assignment
    assignment = models.VolunteerAssignment(
        volunteer_id=current_user.user_id,
        camp_id=camp_id,
        coordinator_id=camp.coordinator_id,
        status=models.AssignmentStatus.PENDING
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return {"message": "Volunteer application submitted successfully", "assignment_id": assignment.assignment_id}


@router.get("/volunteer/assignments", response_model=List[schemas.VolunteerAssignment])
def get_volunteer_assignments(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's volunteer assignments."""
    assignments = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.volunteer_id == current_user.user_id
    ).all()
    
    return assignments


@router.put("/volunteer/hours/{assignment_id}")
def log_volunteer_hours(
    assignment_id: int,
    hours: float,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Log volunteer hours for an assignment."""
    assignment = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.assignment_id == assignment_id,
        models.VolunteerAssignment.volunteer_id == current_user.user_id,
        models.VolunteerAssignment.status == models.AssignmentStatus.ACTIVE
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active assignment not found"
        )
    
    assignment.hours_logged += hours
    db.commit()
    db.refresh(assignment)
    
    return {"message": f"Logged {hours} hours", "total_hours": assignment.hours_logged}


# Donor Functions
@router.post("/donations", response_model=schemas.Donation)
def make_donation(
    donation: schemas.DonationCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Make a donation to a specific camp or general fund."""
    # Validate camp if specified
    if donation.camp_id:
        camp = db.query(models.Camp).filter(models.Camp.camp_id == donation.camp_id).first()
        if not camp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Camp not found"
            )
    
    # Create donation record
    donation_data = donation.dict()
    donation_data["donor_name"] = current_user.full_name
    donation_data["donor_email"] = current_user.email
    
    db_donation = models.Donation(**donation_data)
    db.add(db_donation)
    db.commit()
    db.refresh(db_donation)
    
    return db_donation


@router.get("/donations/history", response_model=List[schemas.Donation])
def get_donation_history(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's donation history."""
    donations = db.query(models.Donation).filter(
        models.Donation.donor_email == current_user.email
    ).order_by(models.Donation.donation_date.desc()).all()
    
    return donations


@router.get("/donations/impact")
def get_donation_impact(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track donation impact for the user."""
    # Get user's donations
    user_donations = db.query(models.Donation).filter(
        models.Donation.donor_email == current_user.email
    ).all()
    
    total_amount = sum(d.amount or 0 for d in user_donations)
    total_donations = len(user_donations)
    
    # Get camps helped
    camps_helped = db.query(models.Camp.name).join(
        models.Donation, models.Camp.camp_id == models.Donation.camp_id
    ).filter(
        models.Donation.donor_email == current_user.email
    ).distinct().all()
    
    return {
        "total_amount_donated": total_amount,
        "total_donations": total_donations,
        "camps_helped": [camp[0] for camp in camps_helped],
        "impact_summary": f"Your {total_donations} donations totaling ${total_amount:.2f} have helped {len(camps_helped)} camps"
    }


# Notifications
@router.get("/notifications", response_model=List[schemas.Notification])
def get_user_notifications(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's notifications."""
    notifications = db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.user_id
    ).order_by(models.Notification.sent_at.desc()).all()
    
    return notifications


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(models.Notification).filter(
        models.Notification.notification_id == notification_id,
        models.Notification.recipient_id == current_user.user_id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.read = True
    notification.read_at = db.func.now()
    db.commit()
    
    return {"message": "Notification marked as read"}


# Profile Management
@router.put("/profile", response_model=schemas.User)
def update_user_profile(
    profile_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile."""
    # Check if username is being changed and if it's already taken
    if profile_update.username and profile_update.username != current_user.username:
        existing_user = db.query(models.User).filter(
            models.User.username == profile_update.username
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check if email is being changed and if it's already taken
    if profile_update.email and profile_update.email != current_user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == profile_update.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    # Update allowed fields
    update_data = profile_update.dict(exclude_unset=True)
    allowed_fields = ['username', 'email', 'full_name', 'skills', 'notification_preferences']
    
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user