import pytest
from datetime import datetime, timedelta
from app.models import User, Disaster, Camp, Donation, UserRole
from app.auth_utils import get_password_hash


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "testpass123"
    }


@pytest.fixture
def sample_user(clean_db, sample_user_data):
    """Create a sample user in the database."""
    user = User(
        username=sample_user_data["username"],
        email=sample_user_data["email"],
        full_name=sample_user_data["full_name"],
        hashed_password=get_password_hash(sample_user_data["password"])
    )
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)
    return user


@pytest.fixture
def sample_disaster_data():
    """Sample disaster data for testing."""
    return {
        "name": "Test Earthquake",
        "type": "Earthquake",
        "location": "Test City",
        "severity_level": "High",
        "status": "Active",
        "start_date": datetime.utcnow(),
        "description": "Test earthquake for testing purposes"
    }


@pytest.fixture
def sample_disaster(clean_db, sample_disaster_data):
    """Create a sample disaster in the database."""
    disaster = Disaster(**sample_disaster_data)
    clean_db.add(disaster)
    clean_db.commit()
    clean_db.refresh(disaster)
    return disaster


@pytest.fixture
def sample_camp_data(sample_disaster):
    """Sample camp data for testing."""
    return {
        "name": "Test Relief Camp",
        "location": "Test Location",
        "capacity": 100,
        "current_occupancy": 50,
        "contact_info": "test@camp.com",
        "facilities": "Basic facilities",
        "disaster_id": sample_disaster.disaster_id
    }


@pytest.fixture
def sample_camp(clean_db, sample_camp_data):
    """Create a sample camp in the database."""
    camp = Camp(**sample_camp_data)
    clean_db.add(camp)
    clean_db.commit()
    clean_db.refresh(camp)
    return camp


@pytest.fixture
def sample_donation_data(sample_disaster):
    """Sample donation data for testing."""
    return {
        "donor_name": "Test Donor",
        "donor_email": "donor@test.com",
        "donor_phone": "1234567890",
        "donation_type": "Money",
        "amount": 1000.0,
        "disaster_id": sample_disaster.disaster_id,
        "status": "Received"
    }


@pytest.fixture
def sample_donation(clean_db, sample_donation_data):
    """Create a sample donation in the database."""
    donation = Donation(**sample_donation_data)
    clean_db.add(donation)
    clean_db.commit()
    clean_db.refresh(donation)
    return donation


@pytest.fixture
def sample_volunteer_data():
    """Sample volunteer user data for testing."""
    return {
        "username": "testvolunteer",
        "email": "volunteer@test.com",
        "full_name": "Test Volunteer",
        "password": "volpass123",
        "skills": ["First Aid", "Communication"]
    }


@pytest.fixture
def sample_volunteer(clean_db, sample_volunteer_data):
    """Create a sample volunteer user in the database."""
    volunteer = User(
        username=sample_volunteer_data["username"],
        email=sample_volunteer_data["email"],
        full_name=sample_volunteer_data["full_name"],
        hashed_password=get_password_hash(sample_volunteer_data["password"]),
        role=UserRole.VOLUNTEER,
        skills=sample_volunteer_data["skills"]
    )
    clean_db.add(volunteer)
    clean_db.commit()
    clean_db.refresh(volunteer)
    return volunteer


@pytest.fixture
def auth_headers(client, sample_user_data, clean_db):
    """Get authentication headers for testing protected endpoints."""
    # First register the user
    response = client.post("/api/auth/register", json=sample_user_data)
    assert response.status_code == 200
    
    # Then login to get token
    login_data = {
        "username": sample_user_data["username"],
        "password": sample_user_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user_data():
    """Sample admin user data for testing."""
    return {
        "username": "admin",
        "email": "admin@example.com",
        "full_name": "Admin User",
        "password": "adminpass123"
    }


@pytest.fixture
def admin_user(clean_db, admin_user_data):
    """Create an admin user in the database."""
    user = User(
        username=admin_user_data["username"],
        email=admin_user_data["email"],
        full_name=admin_user_data["full_name"],
        hashed_password=get_password_hash(admin_user_data["password"]),
        role=UserRole.ADMIN
    )
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)
    return user


@pytest.fixture
def camp_coordinator_user_data():
    """Sample camp coordinator user data for testing."""
    return {
        "username": "coordinator",
        "email": "coordinator@example.com",
        "full_name": "Camp Coordinator",
        "password": "coordpass123"
    }


@pytest.fixture
def camp_coordinator_user(clean_db, camp_coordinator_user_data):
    """Create a camp coordinator user in the database."""
    user = User(
        username=camp_coordinator_user_data["username"],
        email=camp_coordinator_user_data["email"],
        full_name=camp_coordinator_user_data["full_name"],
        hashed_password=get_password_hash(camp_coordinator_user_data["password"]),
        role=UserRole.COORDINATOR
    )
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)
    return user


@pytest.fixture
def volunteer_user_data():
    """Sample volunteer user data for testing."""
    return {
        "username": "volunteer",
        "email": "volunteer@example.com",
        "full_name": "Volunteer User",
        "password": "volpass123"
    }


@pytest.fixture
def volunteer_user(clean_db, volunteer_user_data):
    """Create a volunteer user in the database."""
    user = User(
        username=volunteer_user_data["username"],
        email=volunteer_user_data["email"],
        full_name=volunteer_user_data["full_name"],
        hashed_password=get_password_hash(volunteer_user_data["password"]),
        role=UserRole.VOLUNTEER
    )
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)
    return user


@pytest.fixture
def admin_auth_headers(client, admin_user_data, clean_db):
    """Get admin authentication headers for testing protected endpoints."""
    # First register the admin user
    response = client.post("/api/auth/register", json=admin_user_data)
    assert response.status_code == 200
    
    # Then login to get token
    login_data = {
        "username": admin_user_data["username"],
        "password": admin_user_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def coordinator_auth_headers(client, camp_coordinator_user_data, clean_db):
    """Get camp coordinator authentication headers for testing protected endpoints."""
    # First register the coordinator user
    response = client.post("/api/auth/register", json=camp_coordinator_user_data)
    assert response.status_code == 200
    
    # Then login to get token
    login_data = {
        "username": camp_coordinator_user_data["username"],
        "password": camp_coordinator_user_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def volunteer_auth_headers(client, volunteer_user_data, clean_db):
    """Get volunteer authentication headers for testing protected endpoints."""
    # First register the volunteer user
    response = client.post("/api/auth/register", json=volunteer_user_data)
    assert response.status_code == 200
    
    # Then login to get token
    login_data = {
        "username": volunteer_user_data["username"],
        "password": volunteer_user_data["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}