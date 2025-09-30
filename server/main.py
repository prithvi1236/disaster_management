from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import create_tables
from app.routers import disasters, camps, donations, volunteers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_tables()
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
app.include_router(disasters.router, prefix="/api", tags=["disasters"])
app.include_router(camps.router, prefix="/api", tags=["camps"])
app.include_router(donations.router, prefix="/api", tags=["donations"])
app.include_router(volunteers.router, prefix="/api", tags=["volunteers"])


@app.get("/")
async def root():
    return {"message": "Disaster Management System API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}