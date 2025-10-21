from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_utils import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


def validate_coordinator_qualifications(user: models.User) -> dict:
    """Validate coordinator qualifications and return assessment."""
    assessment = {
        "qualified": True,
        "warnings": [],
        "requirements_met": {
            "has_skills": bool(user.skills and len(user.skills) > 0),
            "has_email": bool(user.email),
            "has_full_name": bool(user.full_name and len(user.full_name.strip()) > 0),
            "account_age_days": 0  # Could be calculated if needed
        }
    }
    
    # Check basic requirements
    if not assessment["requirements_met"]["has_skills"]:
        assessment["warnings"].append("No skills or experience information provided")
    
    if not assessment["requirements_met"]["has_email"]:
        assessment["warnings"].append("No valid email address")
        assessment["qualified"] = False
    
    if not assessment["requirements_met"]["has_full_name"]:
        assessment["warnings"].append("No full name provided")
        assessment["qualified"] = False
    
    # Additional validation could be added here
    # e.g., minimum account age, specific skill requirements, etc.
    
    return assessment


# User Management
@router.get("/users/pending", response_model=List[schemas.User])
def get_pending_users(
    skip: int = 0,
    limit: int = 100,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all pending user approvals (admin only)."""
    users = db.query(models.User).filter(
        models.User.is_approved == False
    ).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}/coordinator-assessment")
def get_coordinator_assessment(
    user_id: int,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed coordinator qualification assessment (admin only)."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != models.UserRole.COORDINATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a coordinator"
        )
    
    assessment = validate_coordinator_qualifications(user)
    
    # Add additional context
    available_camps = db.query(models.Camp).filter(
        models.Camp.coordinator_id == None,
        models.Camp.status == models.CampStatus.ACTIVE
    ).all()
    
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "skills": user.skills or [],
        "created_at": user.created_at,
        "assessment": assessment,
        "available_camps": [
            {
                "camp_id": camp.camp_id,
                "name": camp.name,
                "location": camp.location,
                "capacity": camp.capacity,
                "disaster_name": camp.disaster.name if camp.disaster else "Unknown"
            }
            for camp in available_camps
        ]
    }


@router.get("/rejection-reasons")
def get_rejection_reasons(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get standard rejection reasons for user applications (admin only)."""
    return {
        "coordinator_reasons": [
            "Insufficient qualifications or experience",
            "Incomplete application - missing skills/experience",
            "Failed background verification",
            "Position no longer available",
            "Does not meet minimum requirements",
            "Inadequate leadership experience",
            "Missing required certifications",
            "Application contains false information",
            "Other (please specify in details)"
        ],
        "volunteer_reasons": [
            "Incomplete application",
            "Does not meet age requirements",
            "Failed background check",
            "Insufficient availability",
            "Missing required skills",
            "Other (please specify in details)"
        ],
        "donor_reasons": [
            "Invalid contact information",
            "Suspicious activity detected",
            "Does not meet verification requirements",
            "Other (please specify in details)"
        ]
    }


@router.get("/users", response_model=List[schemas.User])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = Query(None),
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users with optional role filtering (admin only)."""
    query = db.query(models.User)
    
    if role:
        try:
            role_enum = models.UserRole(role.upper())
            query = query.filter(models.User.role == role_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role}"
            )
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("/users/{user_id}/approve", response_model=schemas.User)
def approve_user(
    user_id: int,
    approval_data: schemas.UserApproval,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject user registration (admin only)."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already approved
    if user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already approved"
        )
    
    # Handle approval
    if approval_data.approved:
        user.is_approved = True
        
        # Enhanced coordinator approval logic
        if user.role == models.UserRole.COORDINATOR:
            # Validate coordinator qualifications
            if not user.skills or len(user.skills) == 0:
                # Log warning but don't block approval
                print(f"Warning: Coordinator {user.full_name} approved without skills/experience information")
            
            # Handle camp assignment if provided
            if approval_data.assigned_camp_id:
                # Verify camp exists and is available
                camp = db.query(models.Camp).filter(models.Camp.camp_id == approval_data.assigned_camp_id).first()
                if not camp:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Camp not found"
                    )
                
                # Check if camp already has a coordinator
                if camp.coordinator_id is not None:
                    existing_coordinator = db.query(models.User).filter(
                        models.User.user_id == camp.coordinator_id
                    ).first()
                    if existing_coordinator:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Camp already has a coordinator assigned: {existing_coordinator.full_name}"
                        )
                
                # Verify camp is active and can accept a coordinator
                if camp.status != models.CampStatus.ACTIVE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot assign coordinator to inactive camp"
                    )
                
                # Check if disaster is still active
                disaster = db.query(models.Disaster).filter(
                    models.Disaster.disaster_id == camp.disaster_id
                ).first()
                if disaster and disaster.status == "Resolved":
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot assign coordinator to camp for resolved disaster"
                    )
                
                # Assign coordinator to camp
                user.assigned_camp_id = approval_data.assigned_camp_id
                camp.coordinator_id = user.user_id
                
                # Create notification for the new coordinator
                notification = models.Notification(
                    recipient_id=user.user_id,
                    sender_id=admin_user.user_id,
                    type=models.NotificationType.CAMP,
                    priority=models.NotificationPriority.HIGH,
                    title="Camp Assignment",
                    message=f"You have been assigned as coordinator for {camp.name} in {camp.location}",
                    camp_id=camp.camp_id
                )
                db.add(notification)
        
        # Create approval notification
        approval_notification = models.Notification(
            recipient_id=user.user_id,
            sender_id=admin_user.user_id,
            type=models.NotificationType.SYSTEM,
            priority=models.NotificationPriority.HIGH,
            title="Account Approved",
            message=f"Your {user.role.value} account has been approved and activated. Welcome to the disaster management system!"
        )
        db.add(approval_notification)
        
    else:
        # Handle rejection
        user.is_approved = False
        
        # Store rejection reason if provided
        if hasattr(approval_data, 'rejection_reason') and approval_data.rejection_reason:
            # Create rejection notification with reason
            rejection_notification = models.Notification(
                recipient_id=user.user_id,
                sender_id=admin_user.user_id,
                type=models.NotificationType.SYSTEM,
                priority=models.NotificationPriority.HIGH,
                title="Account Application Rejected",
                message=f"Your {user.role.value} account application has been rejected. Reason: {approval_data.rejection_reason}. You may reapply after addressing the issues mentioned."
            )
            db.add(rejection_notification)
        else:
            # Create generic rejection notification
            rejection_notification = models.Notification(
                recipient_id=user.user_id,
                sender_id=admin_user.user_id,
                type=models.NotificationType.SYSTEM,
                priority=models.NotificationPriority.HIGH,
                title="Account Application Rejected",
                message=f"Your {user.role.value} account application has been rejected. Please contact an administrator for more information."
            )
            db.add(rejection_notification)
    
    try:
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process user approval: {str(e)}"
        )


@router.post("/users/{user_id}/reject")
def reject_user_application(
    user_id: int,
    rejection_data: schemas.UserRejection,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reject user application with detailed reason (admin only)."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is already approved
    if user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already approved user"
        )
    
    # Mark as rejected (keep is_approved as False)
    user.is_approved = False
    
    # Create detailed rejection notification
    rejection_message = f"Your {user.role.value} account application has been rejected.\n\n"
    rejection_message += f"Reason: {rejection_data.reason}\n\n"
    
    if rejection_data.details:
        rejection_message += f"Additional details: {rejection_data.details}\n\n"
    
    rejection_message += "You may reapply after addressing the issues mentioned. "
    rejection_message += "Please contact an administrator if you need clarification."
    
    if rejection_data.can_reapply:
        rejection_message += "\n\nYou are eligible to reapply for this role."
    else:
        rejection_message += "\n\nPlease contact an administrator before reapplying."
    
    # Create rejection notification
    rejection_notification = models.Notification(
        recipient_id=user.user_id,
        sender_id=admin_user.user_id,
        type=models.NotificationType.SYSTEM,
        priority=models.NotificationPriority.HIGH,
        title="Account Application Rejected",
        message=rejection_message
    )
    db.add(rejection_notification)
    
    # Log the rejection for audit purposes
    print(f"User {user.full_name} ({user.email}) rejected by admin {admin_user.full_name}. Reason: {rejection_data.reason}")
    
    try:
        db.commit()
        db.refresh(user)
        
        return {
            "message": "User application rejected successfully",
            "user_id": user.user_id,
            "reason": rejection_data.reason,
            "can_reapply": rejection_data.can_reapply
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject user application: {str(e)}"
        )


@router.put("/users/{user_id}/role", response_model=schemas.User)
def update_user_role(
    user_id: int,
    new_role: models.UserRole,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)."""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = new_role
    
    db.commit()
    db.refresh(user)
    
    return user


# Camp Management
@router.get("/camps/unassigned", response_model=List[schemas.Camp])
def get_unassigned_camps(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get camps without assigned coordinators (admin only)."""
    camps = db.query(models.Camp).filter(models.Camp.coordinator_id == None).all()
    return camps


@router.get("/coordinators/available", response_model=List[schemas.User])
def get_available_coordinators(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get coordinators without assigned camps (admin only)."""
    coordinators = db.query(models.User).filter(
        models.User.role == models.UserRole.COORDINATOR,
        models.User.is_approved == True,
        models.User.assigned_camp_id == None
    ).all()
    return coordinators


# Reports and Analytics
@router.get("/reports/donations")
def get_donation_reports(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get donation reports (admin only)."""
    # Total donations
    total_donations = db.query(models.Donation).count()
    total_amount = db.query(models.Donation).filter(
        models.Donation.amount != None
    ).with_entities(
        db.func.sum(models.Donation.amount)
    ).scalar() or 0
    
    # Donations by type
    donation_types = db.query(
        models.Donation.donation_type,
        db.func.count(models.Donation.donation_id).label('count')
    ).group_by(models.Donation.donation_type).all()
    
    return {
        "total_donations": total_donations,
        "total_amount": float(total_amount),
        "donations_by_type": [{"type": dt[0], "count": dt[1]} for dt in donation_types]
    }


@router.get("/reports/volunteers")
def get_volunteer_reports(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get volunteer reports (admin only)."""
    # Total volunteers
    total_volunteers = db.query(models.User).filter(
        models.User.role == models.UserRole.VOLUNTEER
    ).count()
    
    # Active assignments
    active_assignments = db.query(models.VolunteerAssignment).filter(
        models.VolunteerAssignment.status == models.AssignmentStatus.ACTIVE
    ).count()
    
    # Volunteers by camp
    volunteers_by_camp = db.query(
        models.Camp.name,
        db.func.count(models.VolunteerAssignment.volunteer_id).label('volunteer_count')
    ).join(
        models.VolunteerAssignment, models.Camp.camp_id == models.VolunteerAssignment.camp_id
    ).group_by(models.Camp.name).all()
    
    return {
        "total_volunteers": total_volunteers,
        "active_assignments": active_assignments,
        "volunteers_by_camp": [{"camp": vbc[0], "count": vbc[1]} for vbc in volunteers_by_camp]
    }


@router.get("/reports/resources")
def get_resource_reports(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get resource request reports (admin only)."""
    # Total requests
    total_requests = db.query(models.ResourceRequest).count()
    
    # Requests by status
    requests_by_status = db.query(
        models.ResourceRequest.status,
        db.func.count(models.ResourceRequest.request_id).label('count')
    ).group_by(models.ResourceRequest.status).all()
    
    # Pending requests by urgency
    pending_by_urgency = db.query(
        models.ResourceRequest.urgency,
        db.func.count(models.ResourceRequest.request_id).label('count')
    ).filter(
        models.ResourceRequest.status == models.RequestStatus.PENDING
    ).group_by(models.ResourceRequest.urgency).all()
    
    return {
        "total_requests": total_requests,
        "requests_by_status": [{"status": rbs[0].value, "count": rbs[1]} for rbs in requests_by_status],
        "pending_by_urgency": [{"urgency": pbu[0].value, "count": pbu[1]} for pbu in pending_by_urgency]
    }


# Resource Management
@router.get("/resources/categories")
def get_resource_categories(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all resource categories (admin only)."""
    # Get unique resource types from requests
    categories = db.query(models.ResourceRequest.resource_type).distinct().all()
    return [{"name": cat[0]} for cat in categories]


@router.post("/resources/approve/{request_id}")
def approve_resource_request(
    request_id: int,
    quantity_approved: int,
    notes: Optional[str] = None,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve a resource request (admin only)."""
    request = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.request_id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    request.status = models.RequestStatus.APPROVED
    request.quantity_approved = quantity_approved
    request.approved_by = admin_user.user_id
    request.approved_at = db.func.now()
    if notes:
        request.notes = notes
    
    db.commit()
    db.refresh(request)
    
    return {"message": "Resource request approved successfully", "request": request}


@router.post("/resources/reject/{request_id}")
def reject_resource_request(
    request_id: int,
    notes: str,
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reject a resource request (admin only)."""
    request = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.request_id == request_id
    ).first()
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found"
        )
    
    request.status = models.RequestStatus.REJECTED
    request.approved_by = admin_user.user_id
    request.approved_at = db.func.now()
    request.notes = notes
    
    db.commit()
    db.refresh(request)
    
    return {"message": "Resource request rejected", "request": request}


# Dashboard Statistics
@router.get("/dashboard/stats")
def get_admin_dashboard_stats(
    admin_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics."""
    # Basic counts
    total_disasters = db.query(models.Disaster).count()
    active_disasters = db.query(models.Disaster).filter(
        models.Disaster.status == "Active"
    ).count()
    total_camps = db.query(models.Camp).count()
    total_users = db.query(models.User).count()
    pending_approvals = db.query(models.User).filter(
        models.User.is_approved == False
    ).count()
    
    # Resource requests
    pending_requests = db.query(models.ResourceRequest).filter(
        models.ResourceRequest.status == models.RequestStatus.PENDING
    ).count()
    
    return {
        "total_disasters": total_disasters,
        "active_disasters": active_disasters,
        "total_camps": total_camps,
        "total_users": total_users,
        "pending_approvals": pending_approvals,
        "pending_resource_requests": pending_requests
    }