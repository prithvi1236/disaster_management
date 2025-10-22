"""
Comprehensive validation utilities for the Disaster Management System API.
Provides input validation, data type checking, and business rule validation.
"""

import re
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union
from sqlalchemy.orm import Session
from app import models
from app.error_handlers import ValidationError, validate_required_fields, validate_positive_integer, validate_positive_number
from app.schemas import UserRole, CampStatus, ResourceUrgency, RequestStatus, AssignmentStatus


# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Phone validation regex (flexible format)
PHONE_REGEX = re.compile(r'^[\+]?[1-9][\d]{0,15}$')


def validate_email(email: str, field_name: str = "email") -> None:
    """Validate email format."""
    if not email or not EMAIL_REGEX.match(email):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a valid email address"}
        )


def validate_phone(phone: str, field_name: str = "phone") -> None:
    """Validate phone number format."""
    if not phone or not PHONE_REGEX.match(phone.replace(" ", "").replace("-", "")):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a valid phone number"}
        )


def validate_string_length(
    value: Optional[str], 
    field_name: str, 
    min_length: int = 1, 
    max_length: int = 255,
    required: bool = True
) -> None:
    """Validate string length constraints."""
    if value is None:
        if required:
            raise ValidationError(
                message=f"{field_name} is required",
                field_errors={field_name: "This field is required"}
            )
        return
    
    if not isinstance(value, str):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a string"}
        )
    
    value = value.strip()
    if len(value) < min_length:
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: f"Must be at least {min_length} characters long"}
        )
    
    if len(value) > max_length:
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: f"Must be no more than {max_length} characters long"}
        )


def validate_enum_value(value: Any, enum_class, field_name: str, required: bool = True) -> None:
    """Validate that a value is a valid enum member."""
    if value is None:
        if required:
            raise ValidationError(
                message=f"{field_name} is required",
                field_errors={field_name: "This field is required"}
            )
        return
    
    if value not in [e.value for e in enum_class]:
        valid_values = [e.value for e in enum_class]
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: f"Must be one of: {', '.join(valid_values)}"}
        )


def validate_date(value: Any, field_name: str, required: bool = True) -> None:
    """Validate date value."""
    if value is None:
        if required:
            raise ValidationError(
                message=f"{field_name} is required",
                field_errors={field_name: "This field is required"}
            )
        return
    
    if not isinstance(value, (datetime, date)):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a valid date"}
        )


def validate_date_range(
    start_date: Optional[datetime], 
    end_date: Optional[datetime],
    start_field: str = "start_date",
    end_field: str = "end_date"
) -> None:
    """Validate that end_date is after start_date."""
    if start_date and end_date and end_date <= start_date:
        raise ValidationError(
            message="Invalid date range",
            field_errors={end_field: f"{end_field} must be after {start_field}"}
        )


def validate_capacity_constraints(
    capacity: Optional[int], 
    current_occupancy: Optional[int],
    capacity_field: str = "capacity",
    occupancy_field: str = "current_occupancy"
) -> None:
    """Validate camp capacity constraints."""
    if capacity is not None:
        validate_positive_integer(capacity, capacity_field)
    
    if current_occupancy is not None:
        validate_positive_integer(current_occupancy, occupancy_field)
        
        if capacity is not None and current_occupancy > capacity:
            raise ValidationError(
                message="Invalid occupancy",
                field_errors={occupancy_field: "Current occupancy cannot exceed capacity"}
            )


# Database validation functions

def validate_user_exists(db: Session, user_id: int, field_name: str = "user_id") -> models.User:
    """Validate that a user exists and return the user object."""
    if user_id is None:
        raise ValidationError(
            message=f"{field_name} is required",
            field_errors={field_name: "This field is required"}
        )
    
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise ValidationError(
            message="User not found",
            field_errors={field_name: "User does not exist"}
        )
    
    return user


def validate_disaster_exists(db: Session, disaster_id: int, field_name: str = "disaster_id") -> models.Disaster:
    """Validate that a disaster exists and return the disaster object."""
    if disaster_id is None:
        raise ValidationError(
            message=f"{field_name} is required",
            field_errors={field_name: "This field is required"}
        )
    
    disaster = db.query(models.Disaster).filter(models.Disaster.disaster_id == disaster_id).first()
    if not disaster:
        raise ValidationError(
            message="Disaster not found",
            field_errors={field_name: "Disaster does not exist"}
        )
    
    return disaster


def validate_camp_exists(db: Session, camp_id: int, field_name: str = "camp_id") -> models.Camp:
    """Validate that a camp exists and return the camp object."""
    if camp_id is None:
        raise ValidationError(
            message=f"{field_name} is required",
            field_errors={field_name: "This field is required"}
        )
    
    camp = db.query(models.Camp).filter(models.Camp.camp_id == camp_id).first()
    if not camp:
        raise ValidationError(
            message="Camp not found",
            field_errors={field_name: "Camp does not exist"}
        )
    
    return camp


def validate_volunteer_exists(db: Session, volunteer_id: int, field_name: str = "volunteer_id") -> models.User:
    """Validate that a volunteer exists and return the user object."""
    if volunteer_id is None:
        raise ValidationError(
            message=f"{field_name} is required",
            field_errors={field_name: "This field is required"}
        )
    
    volunteer = db.query(models.User).filter(
        models.User.user_id == volunteer_id,
        models.User.role == UserRole.VOLUNTEER
    ).first()
    if not volunteer:
        raise ValidationError(
            message="Volunteer not found",
            field_errors={field_name: "Volunteer does not exist or is not a volunteer"}
        )
    
    return volunteer


def validate_coordinator_has_camp(db: Session, coordinator_id: int) -> models.Camp:
    """Validate that a coordinator has an assigned camp."""
    coordinator = validate_user_exists(db, coordinator_id, "coordinator_id")
    
    if coordinator.role != UserRole.COORDINATOR:
        raise ValidationError(
            message="User is not a coordinator",
            field_errors={"coordinator_id": "User must have coordinator role"}
        )
    
    if not coordinator.assigned_camp_id:
        raise ValidationError(
            message="Coordinator has no assigned camp",
            field_errors={"coordinator_id": "Coordinator must be assigned to a camp"}
        )
    
    camp = validate_camp_exists(db, coordinator.assigned_camp_id, "assigned_camp_id")
    return camp


def validate_unique_username(db: Session, username: str, exclude_user_id: Optional[int] = None) -> None:
    """Validate that username is unique."""
    query = db.query(models.User).filter(models.User.username == username)
    if exclude_user_id:
        query = query.filter(models.User.user_id != exclude_user_id)
    
    existing_user = query.first()
    if existing_user:
        raise ValidationError(
            message="Username already exists",
            field_errors={"username": "This username is already taken"}
        )


def validate_unique_email(db: Session, email: str, exclude_user_id: Optional[int] = None) -> None:
    """Validate that email is unique."""
    query = db.query(models.User).filter(models.User.email == email)
    if exclude_user_id:
        query = query.filter(models.User.user_id != exclude_user_id)
    
    existing_user = query.first()
    if existing_user:
        raise ValidationError(
            message="Email already exists",
            field_errors={"email": "This email is already registered"}
        )


def validate_camp_coordinator_assignment(db: Session, camp_id: int, coordinator_id: Optional[int] = None) -> None:
    """Validate camp coordinator assignment constraints."""
    if coordinator_id is None:
        return
    
    # Check if coordinator exists and has the right role
    coordinator = validate_user_exists(db, coordinator_id, "coordinator_id")
    if coordinator.role != UserRole.COORDINATOR:
        raise ValidationError(
            message="Invalid coordinator",
            field_errors={"coordinator_id": "User must have coordinator role"}
        )
    
    # Check if coordinator is already assigned to another camp
    if coordinator.assigned_camp_id and coordinator.assigned_camp_id != camp_id:
        raise ValidationError(
            message="Coordinator already assigned",
            field_errors={"coordinator_id": "Coordinator is already assigned to another camp"}
        )


# Business rule validation functions

def validate_disaster_data(data: Dict[str, Any]) -> None:
    """Validate disaster creation/update data."""
    # Required fields for creation
    if "name" in data:
        validate_string_length(data["name"], "name", min_length=3, max_length=100)
    
    if "type" in data:
        validate_string_length(data["type"], "type", min_length=3, max_length=50)
    
    if "location" in data:
        validate_string_length(data["location"], "location", min_length=3, max_length=200)
    
    if "severity_level" in data:
        validate_string_length(data["severity_level"], "severity_level", min_length=3, max_length=20)
    
    if "status" in data:
        valid_statuses = ["Active", "Inactive", "Resolved"]
        if data["status"] not in valid_statuses:
            raise ValidationError(
                message="Invalid status",
                field_errors={"status": f"Must be one of: {', '.join(valid_statuses)}"}
            )
    
    # Date validation
    if "start_date" in data:
        validate_date(data["start_date"], "start_date")
    
    if "end_date" in data:
        validate_date(data["end_date"], "end_date", required=False)
    
    # Date range validation
    if "start_date" in data and "end_date" in data:
        validate_date_range(data["start_date"], data["end_date"])


def validate_camp_data(data: Dict[str, Any], db: Session) -> None:
    """Validate camp creation/update data."""
    # Required fields validation
    if "name" in data:
        validate_string_length(data["name"], "name", min_length=3, max_length=100)
    
    if "location" in data:
        validate_string_length(data["location"], "location", min_length=3, max_length=200)
    
    if "capacity" in data:
        validate_positive_integer(data["capacity"], "capacity")
    
    if "current_occupancy" in data:
        validate_positive_integer(data["current_occupancy"], "current_occupancy")
    
    # Capacity constraints
    if "capacity" in data and "current_occupancy" in data:
        validate_capacity_constraints(data["capacity"], data["current_occupancy"])
    
    # Status validation
    if "status" in data:
        validate_enum_value(data["status"], CampStatus, "status", required=False)
    
    # Foreign key validation
    if "disaster_id" in data:
        validate_disaster_exists(db, data["disaster_id"])
    
    if "coordinator_id" in data:
        validate_camp_coordinator_assignment(db, data.get("camp_id"), data["coordinator_id"])


def validate_user_data(data: Dict[str, Any], db: Session, exclude_user_id: Optional[int] = None) -> None:
    """Validate user creation/update data."""
    # Basic field validation
    if "username" in data:
        validate_string_length(data["username"], "username", min_length=3, max_length=50)
        validate_unique_username(db, data["username"], exclude_user_id)
    
    if "email" in data:
        validate_email(data["email"])
        validate_unique_email(db, data["email"], exclude_user_id)
    
    if "full_name" in data:
        validate_string_length(data["full_name"], "full_name", min_length=2, max_length=100)
    
    if "role" in data:
        validate_enum_value(data["role"], UserRole, "role")


def validate_resource_request_data(data: Dict[str, Any], db: Session) -> None:
    """Validate resource request creation/update data."""
    # Required fields
    if "resource_type" in data:
        validate_string_length(data["resource_type"], "resource_type", min_length=2, max_length=100)
    
    if "quantity_requested" in data:
        validate_positive_integer(data["quantity_requested"], "quantity_requested")
    
    if "quantity_approved" in data:
        validate_positive_integer(data["quantity_approved"], "quantity_approved")
    
    if "description" in data:
        validate_string_length(data["description"], "description", min_length=5, max_length=500)
    
    # Enum validation
    if "urgency" in data:
        validate_enum_value(data["urgency"], ResourceUrgency, "urgency", required=False)
    
    if "status" in data:
        validate_enum_value(data["status"], RequestStatus, "status", required=False)
    
    # Foreign key validation
    if "camp_id" in data:
        validate_camp_exists(db, data["camp_id"])
    
    # Business rule: approved quantity cannot exceed requested quantity
    if "quantity_requested" in data and "quantity_approved" in data:
        if data["quantity_approved"] > data["quantity_requested"]:
            raise ValidationError(
                message="Invalid approval quantity",
                field_errors={"quantity_approved": "Approved quantity cannot exceed requested quantity"}
            )


def validate_donation_data(data: Dict[str, Any], db: Session) -> None:
    """Validate donation creation/update data."""
    # Basic field validation
    if "donor_name" in data and data["donor_name"]:
        validate_string_length(data["donor_name"], "donor_name", min_length=2, max_length=100, required=False)
    
    if "donor_email" in data and data["donor_email"]:
        validate_email(data["donor_email"], "donor_email")
    
    if "donor_phone" in data and data["donor_phone"]:
        validate_phone(data["donor_phone"], "donor_phone")
    
    if "donation_type" in data:
        validate_string_length(data["donation_type"], "donation_type", min_length=2, max_length=50)
    
    if "amount" in data and data["amount"] is not None:
        validate_positive_number(data["amount"], "amount")
    
    if "quantity" in data and data["quantity"] is not None:
        validate_positive_integer(data["quantity"], "quantity")
    
    # Foreign key validation
    if "disaster_id" in data and data["disaster_id"]:
        validate_disaster_exists(db, data["disaster_id"])
    
    if "camp_id" in data and data["camp_id"]:
        validate_camp_exists(db, data["camp_id"])