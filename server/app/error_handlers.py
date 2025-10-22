"""
Standardized error handling utilities for the Disaster Management System API.
Provides consistent error responses, validation, and logging across all endpoints.
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from pydantic import ValidationError
from app.schemas import ErrorResponse

# Configure logging
logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base API error class for consistent error handling."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.error_code = error_code
        super().__init__(self.message)


class ValidationError(APIError):
    """Validation error for input data."""
    
    def __init__(self, message: str, field_errors: Optional[Dict[str, str]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field_errors": field_errors or {}},
            error_code="VALIDATION_ERROR"
        )


class NotFoundError(APIError):
    """Resource not found error."""
    
    def __init__(self, resource: str, identifier: Union[int, str]):
        super().__init__(
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)},
            error_code="RESOURCE_NOT_FOUND"
        )


class AuthenticationError(APIError):
    """Authentication error."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIError):
    """Authorization error."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR"
        )


class DatabaseError(APIError):
    """Database operation error."""
    
    def __init__(self, message: str = "Database operation failed", original_error: Optional[Exception] = None):
        details = {}
        if original_error:
            details["error_type"] = type(original_error).__name__
            
        super().__init__(
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details,
            error_code="DATABASE_ERROR"
        )


class ConflictError(APIError):
    """Resource conflict error."""
    
    def __init__(self, message: str, conflicting_resource: Optional[str] = None):
        details = {}
        if conflicting_resource:
            details["conflicting_resource"] = conflicting_resource
            
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            details=details,
            error_code="RESOURCE_CONFLICT"
        )


def create_error_response(
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    path: Optional[str] = None,
    error_code: Optional[str] = None
) -> ErrorResponse:
    """Create a standardized error response."""
    return ErrorResponse(
        message=message,
        details=details,
        timestamp=datetime.utcnow(),
        path=path or "",
        status_code=status_code,
        error_code=error_code
    )


def handle_database_error(error: SQLAlchemyError, operation: str = "database operation") -> APIError:
    """Handle SQLAlchemy database errors with appropriate error types."""
    
    if isinstance(error, IntegrityError):
        # Handle foreign key constraints and unique violations
        error_msg = str(error.orig) if hasattr(error, 'orig') else str(error)
        
        if "FOREIGN KEY constraint failed" in error_msg:
            return ConflictError(
                message="Operation violates data integrity constraints",
                conflicting_resource="foreign_key_constraint"
            )
        elif "UNIQUE constraint failed" in error_msg:
            return ConflictError(
                message="Resource already exists with these values",
                conflicting_resource="unique_constraint"
            )
        else:
            return ConflictError(
                message="Data integrity constraint violation",
                conflicting_resource="integrity_constraint"
            )
    
    elif isinstance(error, DataError):
        return ValidationError(
            message="Invalid data format or type",
            field_errors={"data": "Data format is invalid"}
        )
    
    else:
        logger.error(f"Database error during {operation}: {str(error)}")
        return DatabaseError(
            message=f"Database error during {operation}",
            original_error=error
        )


def handle_validation_error(error: Union[RequestValidationError, ValidationError]) -> ValidationError:
    """Handle Pydantic validation errors."""
    
    if isinstance(error, RequestValidationError):
        field_errors = {}
        for err in error.errors():
            field_path = ".".join(str(loc) for loc in err["loc"])
            field_errors[field_path] = err["msg"]
        
        return ValidationError(
            message="Request validation failed",
            field_errors=field_errors
        )
    
    else:
        return ValidationError(
            message="Validation error",
            field_errors={"general": str(error)}
        )


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """Validate that required fields are present and not empty."""
    missing_fields = []
    empty_fields = []
    
    for field in required_fields:
        if field not in data:
            missing_fields.append(field)
        elif data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            empty_fields.append(field)
    
    field_errors = {}
    if missing_fields:
        for field in missing_fields:
            field_errors[field] = "This field is required"
    
    if empty_fields:
        for field in empty_fields:
            field_errors[field] = "This field cannot be empty"
    
    if field_errors:
        raise ValidationError(
            message="Required fields are missing or empty",
            field_errors=field_errors
        )


def validate_foreign_key_exists(db, model_class, field_name: str, field_value: int) -> None:
    """Validate that a foreign key reference exists."""
    if field_value is None:
        return
    
    exists = db.query(model_class).filter(
        getattr(model_class, f"{model_class.__tablename__}_id") == field_value
    ).first()
    
    if not exists:
        raise ValidationError(
            message=f"Referenced {model_class.__name__.lower()} does not exist",
            field_errors={field_name: f"Invalid {model_class.__name__.lower()} ID"}
        )


def validate_positive_integer(value: Optional[int], field_name: str) -> None:
    """Validate that a value is a positive integer."""
    if value is not None and (not isinstance(value, int) or value <= 0):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a positive integer"}
        )


def validate_positive_number(value: Optional[float], field_name: str) -> None:
    """Validate that a value is a positive number."""
    if value is not None and (not isinstance(value, (int, float)) or value <= 0):
        raise ValidationError(
            message=f"Invalid {field_name}",
            field_errors={field_name: "Must be a positive number"}
        )


def validate_date_range(start_date: Optional[datetime], end_date: Optional[datetime]) -> None:
    """Validate that end_date is after start_date if both are provided."""
    if start_date and end_date and end_date <= start_date:
        raise ValidationError(
            message="Invalid date range",
            field_errors={"end_date": "End date must be after start date"}
        )


def log_error(error: Exception, context: str, user_id: Optional[int] = None) -> None:
    """Log errors with appropriate context and user information."""
    error_info = {
        "context": context,
        "error_type": type(error).__name__,
        "error_message": str(error),
        "user_id": user_id
    }
    
    if isinstance(error, APIError):
        logger.warning(f"API Error in {context}: {error.message}", extra=error_info)
    elif isinstance(error, SQLAlchemyError):
        logger.error(f"Database Error in {context}: {str(error)}", extra=error_info)
    else:
        logger.error(f"Unexpected Error in {context}: {str(error)}", extra=error_info)


def safe_db_operation(db, operation_func, operation_name: str, *args, **kwargs):
    """Safely execute a database operation with proper error handling."""
    try:
        return operation_func(*args, **kwargs)
    except SQLAlchemyError as e:
        db.rollback()
        raise handle_database_error(e, operation_name)
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during {operation_name}: {str(e)}")
        raise APIError(
            message=f"Operation failed: {operation_name}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )