from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_tables, seed_demo_data
from app.routers import disasters, camps, donations, volunteers, coordinators, resource_requests, volunteer_requests, auth, statistics


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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["authentication"])
app.include_router(statistics.router, prefix="/api", tags=["statistics"])
app.include_router(disasters.router, prefix="/api", tags=["disasters"])
app.include_router(camps.router, prefix="/api", tags=["camps"])
app.include_router(donations.router, prefix="/api", tags=["donations"])
app.include_router(volunteers.router, prefix="/api", tags=["volunteers"])
app.include_router(coordinators.router, prefix="/api", tags=["coordinators"])
app.include_router(resource_requests.router, prefix="/api", tags=["resource-requests"])
app.include_router(volunteer_requests.router, prefix="/api", tags=["volunteer-requests"])


@app.get("/")
async def root():
    return {"message": "Disaster Management System API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}