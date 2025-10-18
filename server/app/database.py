from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - Simple hardcoded for demo
DATABASE_URL = "sqlite:///./disaster_management.db"

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Only needed for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

metadata = MetaData()


async def create_tables():
    """Create database tables"""
    Base.metadata.create_all(bind=engine)


async def seed_demo_data():
    """Seed database with demo data"""
    try:
        from app.seed_data import seed_database
        seed_database()
    except Exception as e:
        print(f"Warning: Could not seed demo data: {e}")


def get_db():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()