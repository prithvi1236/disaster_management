from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_tables, seed_demo_data
# Core resource routers
from app.routers import disasters, camps, donations, volunteers
# Authentication and user management routers  
from app.routers import auth, admin, coordinator, user
# System and monitoring routers
from app.routers import health, statistics, resource_requests, volunteer_assignments
from app.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware, AuthenticationMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
    await seed_demo_data()
    yield
    # Shutdown
    pass


app = FastAPI(
    title="Disaster Management System API",
    description="API for managing disasters, relief camps, donations, and volunteers",
    version="1.0.0",
    lifespan=lifespan
)

# Add custom middleware (order matters - last added is executed first)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(RequestLoggingMiddleware)
# Note: AuthenticationMiddleware is available but not enabled by default
# Individual endpoints use dependency injection for auth instead

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5176"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - all routers now define their own prefixes
app.include_router(disasters.router)
app.include_router(camps.router)
app.include_router(donations.router)
app.include_router(volunteers.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(coordinator.router)
app.include_router(user.router)
app.include_router(health.router)
app.include_router(statistics.router)
app.include_router(resource_requests.router)
app.include_router(volunteer_assignments.router)


@app.get("/")
async def root():
    return {"message": "Disaster Management System API", "version": "1.0.0"}


