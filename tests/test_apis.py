import pytest
from fastapi.testclient import TestClient
from tests.test_fixtures import *
from app.models import UserRole


class TestDisasterAPI:
    """Test disaster API endpoints."""
    
    def test_get_disasters(self, client: TestClient, sample_disaster):
        """Test getting disasters list."""
        response = client.get("/api/disasters/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first disaster
        disaster = data[0]
        assert "disaster_id" in disaster
        assert "name" in disaster
        assert "type" in disaster
        assert "location" in disaster
    
    def test_get_disaster_by_id(self, client: TestClient, sample_disaster):
        """Test getting a specific disaster."""
        response = client.get(f"/api/disasters/{sample_disaster.disaster_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["disaster_id"] == sample_disaster.disaster_id
        assert data["name"] == sample_disaster.name
    
    def test_get_nonexistent_disaster(self, client: TestClient):
        """Test getting a nonexistent disaster."""
        response = client.get("/api/disasters/99999")
        
        assert response.status_code == 404


class TestCampAPI:
    """Test camp API endpoints."""
    
    def test_get_camps(self, client: TestClient, sample_camp):
        """Test getting camps list."""
        response = client.get("/api/camps/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first camp
        camp = data[0]
        assert "camp_id" in camp
        assert "name" in camp
        assert "location" in camp
        assert "capacity" in camp
    
    def test_get_camp_by_id(self, client: TestClient, sample_camp):
        """Test getting a specific camp."""
        response = client.get(f"/api/camps/{sample_camp.camp_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["camp_id"] == sample_camp.camp_id
        assert data["name"] == sample_camp.name
    
    def test_get_nonexistent_camp(self, client: TestClient):
        """Test getting a nonexistent camp."""
        response = client.get("/api/camps/99999")
        
        assert response.status_code == 404


class TestDonationAPI:
    """Test donation API endpoints."""
    
    def test_get_donations(self, client: TestClient, sample_donation):
        """Test getting donations list."""
        response = client.get("/api/donations/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first donation
        donation = data[0]
        assert "donation_id" in donation
        assert "donor_name" in donation
        assert "donation_type" in donation
        assert "amount" in donation
    
    def test_get_donation_by_id(self, client: TestClient, sample_donation):
        """Test getting a specific donation."""
        response = client.get(f"/api/donations/{sample_donation.donation_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["donation_id"] == sample_donation.donation_id
        assert data["donor_name"] == sample_donation.donor_name
    
    def test_get_nonexistent_donation(self, client: TestClient):
        """Test getting a nonexistent donation."""
        response = client.get("/api/donations/99999")
        
        assert response.status_code == 404


class TestVolunteerAPI:
    """Test volunteer API endpoints."""
    
    def test_get_volunteers(self, client: TestClient, sample_volunteer):
        """Test getting volunteers list."""
        response = client.get("/api/volunteers/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Check first volunteer
        volunteer = data[0]
        assert "volunteer_id" in volunteer
        assert "name" in volunteer
        assert "email" in volunteer
        assert "phone" in volunteer
    
    def test_get_volunteer_by_id(self, client: TestClient, sample_volunteer):
        """Test getting a specific volunteer."""
        response = client.get(f"/api/volunteers/{sample_volunteer.volunteer_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["volunteer_id"] == sample_volunteer.volunteer_id
        assert data["name"] == sample_volunteer.name
    
    def test_get_nonexistent_volunteer(self, client: TestClient):
        """Test getting a nonexistent volunteer."""
        response = client.get("/api/volunteers/99999")
        
        assert response.status_code == 404


class TestStatisticsAPI:
    """Test statistics API endpoints."""
    
    def test_get_dashboard_stats(self, client: TestClient, sample_disaster, sample_camp, sample_donation, sample_volunteer):
        """Test getting dashboard statistics."""
        response = client.get("/api/statistics/dashboard")
        
        assert response.status_code == 200
        data = response.json()
        assert "totals" in data
        assert "active" in data
        assert "donations" in data
        assert "camps" in data
        assert data["totals"]["disasters"] >= 1
        assert data["totals"]["camps"] >= 1
        assert data["totals"]["donations"] >= 1
        assert data["totals"]["volunteers"] >= 1


class TestDatabaseModels:
    """Test database models directly."""
    
    def test_user_model(self, clean_db, sample_user):
        """Test User model functionality."""
        assert sample_user.user_id is not None
        assert sample_user.username == "testuser"
        assert sample_user.email == "test@example.com"
        assert sample_user.is_active is True
        assert sample_user.role == UserRole.VOLUNTEER_USER
    
    def test_disaster_model(self, clean_db, sample_disaster):
        """Test Disaster model functionality."""
        assert sample_disaster.disaster_id is not None
        assert sample_disaster.name == "Test Earthquake"
        assert sample_disaster.type == "Earthquake"
        assert sample_disaster.status == "Active"
    
    def test_camp_model(self, clean_db, sample_camp):
        """Test Camp model functionality."""
        assert sample_camp.camp_id is not None
        assert sample_camp.name == "Test Relief Camp"
        assert sample_camp.capacity == 100
        assert sample_camp.occupancy == 50
    
    def test_donation_model(self, clean_db, sample_donation):
        """Test Donation model functionality."""
        assert sample_donation.donation_id is not None
        assert sample_donation.donor_name == "Test Donor"
        assert sample_donation.amount == 1000.0
        assert sample_donation.status == "Received"
    
    def test_volunteer_model(self, clean_db, sample_volunteer):
        """Test Volunteer model functionality."""
        assert sample_volunteer.volunteer_id is not None
        assert sample_volunteer.name == "Test Volunteer"
        assert sample_volunteer.email == "volunteer@test.com"
        assert sample_volunteer.background_check is True


class TestModelRelationships:
    """Test model relationships."""
    
    def test_disaster_camp_relationship(self, clean_db, sample_disaster, sample_camp):
        """Test relationship between disaster and camp."""
        assert sample_camp.disaster_id == sample_disaster.disaster_id
        
        # Test relationship access
        camps = clean_db.query(sample_disaster.__class__).filter_by(
            disaster_id=sample_disaster.disaster_id
        ).first().camps
        
        assert len(camps) == 1
        assert camps[0].camp_id == sample_camp.camp_id
    
    def test_disaster_donation_relationship(self, clean_db, sample_disaster, sample_donation):
        """Test relationship between disaster and donation."""
        assert sample_donation.disaster_id == sample_disaster.disaster_id
        
        # Test relationship access
        donations = clean_db.query(sample_disaster.__class__).filter_by(
            disaster_id=sample_disaster.disaster_id
        ).first().donations
        
        assert len(donations) == 1
        assert donations[0].donation_id == sample_donation.donation_id