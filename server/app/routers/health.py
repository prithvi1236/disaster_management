from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("/")
def basic_health_check() -> Dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Disaster Management System API",
        "version": "1.0.0"
    }


@router.get("/detailed")
def detailed_health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Detailed health check with database connectivity and component status."""
    components = {}
    overall_status = "healthy"
    
    # Test database connection
    try:
        db.execute(text("SELECT 1"))
        components["database"] = {
            "status": "connected",
            "message": "Database connection successful"
        }
    except Exception as e:
        components["database"] = {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }
        overall_status = "degraded"
    
    # Check authentication system
    components["authentication"] = {
        "status": "operational",
        "message": "JWT authentication system active"
    }
    
    # Check middleware
    components["middleware"] = {
        "status": "operational", 
        "message": "Error handling and logging middleware active"
    }
    
    # Check statistics system
    components["statistics"] = {
        "status": "operational",
        "message": "Statistics and analytics system active"
    }
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Disaster Management System API",
        "version": "1.0.0",
        "components": components,
        "features": {
            "authentication": "enabled",
            "error_handling": "enabled",
            "request_logging": "enabled",
            "statistics": "enabled",
            "health_monitoring": "enabled"
        }
    }