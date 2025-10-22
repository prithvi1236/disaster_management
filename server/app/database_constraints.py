"""
Database constraint handling utilities for the Disaster Management System.
Provides proper cascade delete operations and foreign key constraint management.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models
from app.error_handlers import ConflictError, DatabaseError, safe_db_operation

logger = logging.getLogger(__name__)


class CascadeDeleteResult:
    """Result of a cascade delete operation."""
    
    def __init__(self, primary_deleted: bool = False):
        self.primary_deleted = primary_deleted
        self.deleted_records: Dict[str, int] = {}
        self.warnings: List[str] = []
        self.errors: List[str] = []
    
    def add_deleted(self, table_name: str, count: int):
        """Add deleted record count for a table."""
        self.deleted_records[table_name] = count
    
    def add_warning(self, message: str):
        """Add a warning message."""
        self.warnings.append(message)
    
    def add_error(self, message: str):
        """Add an error message."""
        self.errors.append(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for API response."""
        return {
            "primary_deleted": self.primary_deleted,
            "deleted_records": self.deleted_records,
            "warnings": self.warnings,
            "errors": self.errors,
            "total_affected": sum(self.deleted_records.values())
        }


def check_foreign_key_dependencies(db: Session, model_class, record_id: int) -> Dict[str, int]:
    """Check what records depend on the given record via foreign keys."""
    dependencies = {}
    
    if model_class == models.Disaster:
        # Check camps that depend on this disaster
        camp_count = db.query(models.Camp).filter(models.Camp.disaster_id == record_id).count()
        if camp_count > 0:
            dependencies["camps"] = camp_count
        
        # Check donations that depend on this disaster
        donation_count = db.query(models.Donation).filter(models.Donation.disaster_id == record_id).count()
        if donation_count > 0:
            dependencies["donations"] = donation_count
    
    elif model_class == models.Camp:
        # Check resource requests that depend on this camp
        request_count = db.query(models.ResourceRequest).filter(models.ResourceRequest.camp_id == record_id).count()
        if request_count > 0:
            dependencies["resource_requests"] = request_count
        
        # Check volunteer assignments that depend on this camp
        assignment_count = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.camp_id == record_id).count()
        if assignment_count > 0:
            dependencies["volunteer_assignments"] = assignment_count
        
        # Check donations that depend on this camp
        donation_count = db.query(models.Donation).filter(models.Donation.camp_id == record_id).count()
        if donation_count > 0:
            dependencies["donations"] = donation_count
        
        # Check notifications that depend on this camp
        notification_count = db.query(models.Notification).filter(models.Notification.camp_id == record_id).count()
        if notification_count > 0:
            dependencies["notifications"] = notification_count
        
        # Check if any coordinator is assigned to this camp
        coordinator_count = db.query(models.User).filter(models.User.assigned_camp_id == record_id).count()
        if coordinator_count > 0:
            dependencies["assigned_coordinators"] = coordinator_count
    
    elif model_class == models.User:
        # Check what this user has created or is assigned to
        if hasattr(models.User, 'role'):
            user = db.query(models.User).filter(models.User.user_id == record_id).first()
            if user:
                if user.role == models.UserRole.COORDINATOR:
                    # Check camps coordinated by this user
                    coordinated_camps = db.query(models.Camp).filter(models.Camp.coordinator_id == record_id).count()
                    if coordinated_camps > 0:
                        dependencies["coordinated_camps"] = coordinated_camps
                    
                    # Check resource requests made by this coordinator
                    requests = db.query(models.ResourceRequest).filter(models.ResourceRequest.coordinator_id == record_id).count()
                    if requests > 0:
                        dependencies["resource_requests"] = requests
                
                # Check volunteer assignments
                assignments = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.volunteer_id == record_id).count()
                if assignments > 0:
                    dependencies["volunteer_assignments"] = assignments
                
                # Check created disasters
                disasters = db.query(models.Disaster).filter(models.Disaster.created_by == record_id).count()
                if disasters > 0:
                    dependencies["created_disasters"] = disasters
                
                # Check created camps
                camps = db.query(models.Camp).filter(models.Camp.created_by == record_id).count()
                if camps > 0:
                    dependencies["created_camps"] = camps
    
    return dependencies


def cascade_delete_disaster(db: Session, disaster_id: int) -> CascadeDeleteResult:
    """Perform cascade delete for a disaster and all dependent records."""
    result = CascadeDeleteResult()
    
    try:
        # Get the disaster first
        disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
        if not disaster:
            result.add_error("Disaster not found")
            return result
        
        # Check dependencies before deletion
        dependencies = check_foreign_key_dependencies(db, models.Disaster, disaster_id)
        
        # Delete dependent camps and their cascading records
        camps = db.query(models.Camp).filter(models.Camp.disaster_id == disaster_id).all()
        for camp in camps:
            camp_result = cascade_delete_camp(db, camp.camp_id)
            # Merge results
            for table, count in camp_result.deleted_records.items():
                result.deleted_records[table] = result.deleted_records.get(table, 0) + count
            result.warnings.extend(camp_result.warnings)
            result.errors.extend(camp_result.errors)
        
        # Delete donations directly linked to disaster
        disaster_donations = db.query(models.Donation).filter(models.Donation.disaster_id == disaster_id).all()
        for donation in disaster_donations:
            db.delete(donation)
        if disaster_donations:
            result.add_deleted("donations", len(disaster_donations))
        
        # Finally delete the disaster itself
        db.delete(disaster)
        result.primary_deleted = True
        result.add_deleted("disasters", 1)
        
        db.commit()
        
        if dependencies:
            result.add_warning(f"Deleted disaster with {sum(dependencies.values())} dependent records")
        
    except IntegrityError as e:
        db.rollback()
        result.add_error(f"Database integrity error during cascade delete: {str(e)}")
        logger.error(f"Integrity error in cascade_delete_disaster: {str(e)}")
    except Exception as e:
        db.rollback()
        result.add_error(f"Unexpected error during cascade delete: {str(e)}")
        logger.error(f"Error in cascade_delete_disaster: {str(e)}")
    
    return result


def cascade_delete_camp(db: Session, camp_id: int) -> CascadeDeleteResult:
    """Perform cascade delete for a camp and all dependent records."""
    result = CascadeDeleteResult()
    
    try:
        # Get the camp first
        camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
        if not camp:
            result.add_error("Camp not found")
            return result
        
        # Delete resource requests for this camp
        resource_requests = db.query(models.ResourceRequest).filter(models.ResourceRequest.camp_id == camp_id).all()
        for request in resource_requests:
            db.delete(request)
        if resource_requests:
            result.add_deleted("resource_requests", len(resource_requests))
        
        # Delete volunteer assignments for this camp
        assignments = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.camp_id == camp_id).all()
        for assignment in assignments:
            db.delete(assignment)
        if assignments:
            result.add_deleted("volunteer_assignments", len(assignments))
        
        # Delete donations for this camp
        donations = db.query(models.Donation).filter(models.Donation.camp_id == camp_id).all()
        for donation in donations:
            db.delete(donation)
        if donations:
            result.add_deleted("donations", len(donations))
        
        # Delete notifications for this camp
        notifications = db.query(models.Notification).filter(models.Notification.camp_id == camp_id).all()
        for notification in notifications:
            db.delete(notification)
        if notifications:
            result.add_deleted("notifications", len(notifications))
        
        # Unassign coordinators from this camp
        coordinators = db.query(models.User).filter(models.User.assigned_camp_id == camp_id).all()
        for coordinator in coordinators:
            coordinator.assigned_camp_id = None
        if coordinators:
            result.add_deleted("coordinator_assignments", len(coordinators))
            result.add_warning(f"Unassigned {len(coordinators)} coordinator(s) from deleted camp")
        
        # Finally delete the camp itself
        db.delete(camp)
        result.primary_deleted = True
        result.add_deleted("camps", 1)
        
        # Don't commit here if called from cascade_delete_disaster
        
    except IntegrityError as e:
        result.add_error(f"Database integrity error during camp cascade delete: {str(e)}")
        logger.error(f"Integrity error in cascade_delete_camp: {str(e)}")
    except Exception as e:
        result.add_error(f"Unexpected error during camp cascade delete: {str(e)}")
        logger.error(f"Error in cascade_delete_camp: {str(e)}")
    
    return result


def safe_delete_user(db: Session, user_id: int) -> CascadeDeleteResult:
    """Safely delete a user, handling all dependencies."""
    result = CascadeDeleteResult()
    
    try:
        # Get the user first
        user = db.query(models.User).filter(models.User.user_id == user_id).first()
        if not user:
            result.add_error("User not found")
            return result
        
        # Check dependencies
        dependencies = check_foreign_key_dependencies(db, models.User, user_id)
        
        if dependencies:
            # For users with dependencies, we need to handle them carefully
            if user.role == models.UserRole.COORDINATOR:
                # Unassign from camps
                coordinated_camps = db.query(models.Camp).filter(models.Camp.coordinator_id == user_id).all()
                for camp in coordinated_camps:
                    camp.coordinator_id = None
                if coordinated_camps:
                    result.add_warning(f"Unassigned coordinator from {len(coordinated_camps)} camp(s)")
                
                # Handle resource requests - set coordinator to None or delete based on status
                resource_requests = db.query(models.ResourceRequest).filter(models.ResourceRequest.coordinator_id == user_id).all()
                for request in resource_requests:
                    if request.status == models.RequestStatus.PENDING:
                        db.delete(request)  # Delete pending requests
                    else:
                        request.coordinator_id = None  # Keep approved/fulfilled requests but remove coordinator reference
                if resource_requests:
                    result.add_deleted("resource_requests", len(resource_requests))
            
            # Handle volunteer assignments
            assignments = db.query(models.VolunteerAssignment).filter(models.VolunteerAssignment.volunteer_id == user_id).all()
            for assignment in assignments:
                if assignment.status in [models.AssignmentStatus.PENDING, models.AssignmentStatus.APPROVED]:
                    db.delete(assignment)  # Delete inactive assignments
                else:
                    assignment.volunteer_id = None  # Keep completed assignments for records
            if assignments:
                result.add_deleted("volunteer_assignments", len(assignments))
            
            # For created records, we typically don't delete them but set created_by to None
            created_disasters = db.query(models.Disaster).filter(models.Disaster.created_by == user_id).all()
            for disaster in created_disasters:
                disaster.created_by = None
            
            created_camps = db.query(models.Camp).filter(models.Camp.created_by == user_id).all()
            for camp in created_camps:
                camp.created_by = None
        
        # Delete the user
        db.delete(user)
        result.primary_deleted = True
        result.add_deleted("users", 1)
        
        db.commit()
        
        if dependencies:
            result.add_warning(f"Deleted user with {sum(dependencies.values())} dependent records")
        
    except IntegrityError as e:
        db.rollback()
        result.add_error(f"Database integrity error during user delete: {str(e)}")
        logger.error(f"Integrity error in safe_delete_user: {str(e)}")
    except Exception as e:
        db.rollback()
        result.add_error(f"Unexpected error during user delete: {str(e)}")
        logger.error(f"Error in safe_delete_user: {str(e)}")
    
    return result


def validate_foreign_key_constraints(db: Session, table_name: str, data: Dict[str, Any]) -> None:
    """Validate foreign key constraints before insert/update operations."""
    
    if table_name == "camps":
        # Validate disaster_id exists
        if "disaster_id" in data and data["disaster_id"]:
            disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == data["disaster_id"]).first()
            if not disaster:
                raise ConflictError(
                    message="Referenced disaster does not exist",
                    conflicting_resource="disaster_id"
                )
        
        # Validate coordinator_id exists and has correct role
        if "coordinator_id" in data and data["coordinator_id"]:
            coordinator = db.query(models.User).filter(
                models.User.user_id == data["coordinator_id"],
                models.User.role == models.UserRole.COORDINATOR
            ).first()
            if not coordinator:
                raise ConflictError(
                    message="Referenced coordinator does not exist or is not a coordinator",
                    conflicting_resource="coordinator_id"
                )
    
    elif table_name == "resource_requests":
        # Validate camp_id exists
        if "camp_id" in data and data["camp_id"]:
            camp = db.query(models.Camp).filter(models.Camp.camp_id == data["camp_id"]).first()
            if not camp:
                raise ConflictError(
                    message="Referenced camp does not exist",
                    conflicting_resource="camp_id"
                )
        
        # Validate coordinator_id exists and has correct role
        if "coordinator_id" in data and data["coordinator_id"]:
            coordinator = db.query(models.User).filter(
                models.User.user_id == data["coordinator_id"],
                models.User.role == models.UserRole.COORDINATOR
            ).first()
            if not coordinator:
                raise ConflictError(
                    message="Referenced coordinator does not exist or is not a coordinator",
                    conflicting_resource="coordinator_id"
                )
    
    elif table_name == "volunteer_assignments":
        # Validate volunteer_id exists and has correct role
        if "volunteer_id" in data and data["volunteer_id"]:
            volunteer = db.query(models.User).filter(
                models.User.user_id == data["volunteer_id"],
                models.User.role == models.UserRole.VOLUNTEER
            ).first()
            if not volunteer:
                raise ConflictError(
                    message="Referenced volunteer does not exist or is not a volunteer",
                    conflicting_resource="volunteer_id"
                )
        
        # Validate camp_id exists
        if "camp_id" in data and data["camp_id"]:
            camp = db.query(models.Camp).filter(models.Camp.camp_id == data["camp_id"]).first()
            if not camp:
                raise ConflictError(
                    message="Referenced camp does not exist",
                    conflicting_resource="camp_id"
                )
        
        # Validate coordinator_id exists and has correct role
        if "coordinator_id" in data and data["coordinator_id"]:
            coordinator = db.query(models.User).filter(
                models.User.user_id == data["coordinator_id"],
                models.User.role == models.UserRole.COORDINATOR
            ).first()
            if not coordinator:
                raise ConflictError(
                    message="Referenced coordinator does not exist or is not a coordinator",
                    conflicting_resource="coordinator_id"
                )
    
    elif table_name == "donations":
        # Validate disaster_id exists if provided
        if "disaster_id" in data and data["disaster_id"]:
            disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == data["disaster_id"]).first()
            if not disaster:
                raise ConflictError(
                    message="Referenced disaster does not exist",
                    conflicting_resource="disaster_id"
                )
        
        # Validate camp_id exists if provided
        if "camp_id" in data and data["camp_id"]:
            camp = db.query(models.Camp).filter(models.Camp.camp_id == data["camp_id"]).first()
            if not camp:
                raise ConflictError(
                    message="Referenced camp does not exist",
                    conflicting_resource="camp_id"
                )


def get_cascade_preview(db: Session, model_class, record_id: int) -> Dict[str, Any]:
    """Get a preview of what would be deleted in a cascade operation."""
    dependencies = check_foreign_key_dependencies(db, model_class, record_id)
    
    preview = {
        "primary_record": {
            "type": model_class.__name__.lower(),
            "id": record_id
        },
        "dependent_records": dependencies,
        "total_affected": sum(dependencies.values()) + 1,  # +1 for primary record
        "warnings": []
    }
    
    if dependencies:
        preview["warnings"].append(f"This operation will affect {sum(dependencies.values())} dependent records")
        
        if model_class == models.Disaster and "camps" in dependencies:
            preview["warnings"].append(f"Deleting this disaster will also delete {dependencies['camps']} camp(s) and all their associated data")
        
        if model_class == models.Camp:
            if "resource_requests" in dependencies:
                preview["warnings"].append(f"Deleting this camp will also delete {dependencies['resource_requests']} resource request(s)")
            if "volunteer_assignments" in dependencies:
                preview["warnings"].append(f"Deleting this camp will also delete {dependencies['volunteer_assignments']} volunteer assignment(s)")
    
    return preview