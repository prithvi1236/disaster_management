"""
Disaster Management System API

A comprehensive FastAPI application for managing disaster response operations,
including relief camps, volunteer coordination, resource management, and donations.

Features:
- Multi-role authentication (Admin, Coordinator, User)
- Real-time disaster tracking and management
- Volunteer registration and assignment system
- Resource request and approval workflow
- Donation tracking and management
- Camp coordination and statistics

Author: Disaster Management Team
Version: 1.0.0
"""
import os
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.database import create_tables, seed_demo_data, get_db_health
from app.routers import (
    disasters, camps, donations, volunteers, coordinators, 
    resource_requests, volunteer_requests, auth, statistics
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    Handles:
    - Database table creation
    - Demo data seeding (development only)
    - Cleanup on shutdown
    """
    # Startup
    logger.info(f"Starting Disaster Management API in {ENVIRONMENT} mode")
    
    try:
        await create_tables()
        
        # Only seed demo data in development
        if ENVIRONMENT == "development":
            await seed_demo_data()
            
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Application shutdown completed")


# FastAPI application instance with comprehensive configuration
app = FastAPI(
    title="Disaster Management System API",
    description="""
    A comprehensive API for disaster response management in India.
    
    ## Features
    
    * **Multi-role Authentication**: Admin, Camp Coordinator, and User roles
    * **Disaster Management**: Track and manage natural disasters across India
    * **Relief Camp Operations**: Coordinate relief camps and resources
    * **Volunteer System**: Register, approve, and assign volunteers
    * **Resource Management**: Request and track resource distribution
    * **Donation Tracking**: Manage monetary and supply donations
    * **Real-time Statistics**: Dashboard with live disaster response metrics
    
    ## Authentication
    
    Most endpoints require authentication using JWT Bearer tokens.
    Use the `/api/auth/login` endpoint to obtain a token.
    
    ## Demo Credentials
    
    - **Admin**: username=`admin`, password=`admin123`
    - **Coordinator**: username=`coordinator1`, password=`coord123`
    - **User**: username=`volunteer_user`, password=`user123`
    """,
    version="1.0.0",
    lifespan=lifespan,
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if DEBUG else None
)

# Security middleware - Trusted hosts
if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=ALLOWED_HOSTS
    )

# CORS middleware with environment-specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Request timing middleware for performance monitoring
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add response time header for performance monitoring."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_id": str(int(time.time()))  # Simple error tracking ID
        }
    )

# Include API routers with proper organization
app.include_router(
    auth.router, 
    prefix="/api", 
    tags=["Authentication"],
    responses={401: {"description": "Authentication failed"}}
)

app.include_router(
    statistics.router, 
    prefix="/api", 
    tags=["Statistics & Analytics"],
    dependencies=[]  # Statistics may have public endpoints
)

app.include_router(
    disasters.router, 
    prefix="/api", 
    tags=["Disaster Management"],
    responses={404: {"description": "Disaster not found"}}
)

app.include_router(
    camps.router, 
    prefix="/api", 
    tags=["Relief Camps"],
    responses={404: {"description": "Camp not found"}}
)

app.include_router(
    donations.router, 
    prefix="/api", 
    tags=["Donations"],
    responses={400: {"description": "Invalid donation data"}}
)

app.include_router(
    volunteers.router, 
    prefix="/api", 
    tags=["Volunteer Management"],
    responses={403: {"description": "Insufficient permissions"}}
)

app.include_router(
    coordinators.router, 
    prefix="/api", 
    tags=["Camp Coordinators"],
    responses={403: {"description": "Admin access required"}}
)

app.include_router(
    resource_requests.router, 
    prefix="/api", 
    tags=["Resource Requests"],
    responses={404: {"description": "Request not found"}}
)

app.include_router(
    volunteer_requests.router, 
    prefix="/api", 
    tags=["Volunteer Requests"],
    responses={403: {"description": "Coordinator access required"}}
)


@app.get("/", tags=["System"])
async def root():
    """
    API root endpoint providing basic system information.
    
    Returns:
        dict: System information including version and status
    """
    return {
        "message": "Disaster Management System API",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "docs_url": "/docs" if DEBUG else "Contact administrator for API documentation",
        "status": "operational"
    }


@app.get("/health", tags=["System"])
async def health_check():
    """
    Comprehensive health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Detailed health status including database connectivity
    """
    db_health = get_db_health()
    
    return {
        "status": "healthy" if db_health["status"] == "healthy" else "unhealthy",
        "timestamp": int(time.time()),
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "database": db_health,
        "uptime": "Available via process monitoring"
    }


@app.get("/metrics", tags=["System"])
async def get_metrics():
    """
    Basic metrics endpoint for monitoring (production environments).
    
    Returns:
        dict: System metrics and performance indicators
    """
    if ENVIRONMENT != "production":
        return {"message": "Metrics only available in production"}
    
    # In production, integrate with proper metrics collection
    return {
        "requests_total": "Available via monitoring system",
        "response_time_avg": "Available via monitoring system",
        "active_connections": "Available via monitoring system"
    }