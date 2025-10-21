import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'server'))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from main import app

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_disaster_management.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session")
def test_app():
    """Create test application."""
    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture(scope="session")
def client(test_app):
    """Create test client."""
    return TestClient(test_app)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def clean_db(db_session):
    """Provide a clean database for each test."""
    return db_session