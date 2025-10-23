"""
Database configuration and connection management for Disaster Management System.

This module handles SQLAlchemy setup, connection pooling, and database session management.
Supports both SQLite (development) and PostgreSQL (production) databases.
"""
from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database URL configuration with environment variable support
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./disaster_management.db")

# SQLAlchemy engine configuration with optimizations
if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific configuration for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,  # Allow SQLite to be used across threads
            "timeout": 20  # Connection timeout in seconds
        },
        poolclass=StaticPool,  # Use static pool for SQLite
        pool_pre_ping=True,  # Verify connections before use
        echo=os.getenv("SQL_DEBUG", "false").lower() == "true"  # SQL query logging
    )
    
    # Enable WAL mode for better SQLite performance
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        """Set SQLite pragmas for better performance and reliability."""
        cursor = dbapi_connection.cursor()
        # Enable WAL mode for better concurrency
        cursor.execute("PRAGMA journal_mode=WAL")
        # Enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys=ON")
        # Set synchronous mode for better performance
        cursor.execute("PRAGMA synchronous=NORMAL")
        # Set cache size (negative value = KB, positive = pages)
        cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
        cursor.close()
        
else:
    # PostgreSQL/other database configuration for production
    engine = create_engine(
        DATABASE_URL,
        pool_size=int(os.getenv("DB_POOL_SIZE", "10")),  # Connection pool size
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "20")),  # Max overflow connections
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "3600")),  # Recycle connections every hour
        echo=os.getenv("SQL_DEBUG", "false").lower() == "true"  # SQL query logging
    )

# Session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,  # Manual flush control for better performance
    bind=engine,
    expire_on_commit=False  # Keep objects accessible after commit
)

# Declarative base for model definitions
Base = declarative_base()

# Metadata for schema operations
metadata = MetaData()


async def create_tables():
    """
    Create all database tables defined in models.
    
    This function is called during application startup to ensure
    all required tables exist in the database.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


async def seed_demo_data():
    """
    Seed database with demonstration data.
    
    This function populates the database with sample data for testing
    and demonstration purposes. It's safe to call multiple times as it
    checks for existing data before seeding.
    """
    try:
        from app.seed_data import seed_database
        seed_database()
        logger.info("Demo data seeding completed")
    except Exception as e:
        logger.warning(f"Could not seed demo data: {e}")
        # Don't raise exception as this is optional for production


def get_db():
    """
    Database session dependency for FastAPI dependency injection.
    
    This function provides a database session that is automatically
    closed after the request is completed. It ensures proper connection
    management and prevents connection leaks.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def get_db_health() -> dict:
    """
    Check database connection health.
    
    Returns:
        dict: Health status information including connection state
    """
    try:
        db = SessionLocal()
        # Simple query to test connection
        db.execute("SELECT 1")
        db.close()
        return {
            "status": "healthy",
            "database": "connected",
            "engine_pool_size": engine.pool.size(),
            "engine_pool_checked_out": engine.pool.checkedout()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }