import pytest
from fastapi.testclient import TestClient
from app.models import User
from tests.test_fixtures import *


class TestUserRegistration:
    """Test user registration functionality."""
    
    def test_register_user_success(self, client: TestClient, clean_db, sample_user_data):
        """Test successful user registration."""
        response = client.post("/api/auth/register", json=sample_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
        assert data["is_active"] is True
        assert data["role"] == "volunteer_user"
        assert "user_id" in data
        assert "created_at" in data
    
    def test_register_duplicate_username(self, client: TestClient, sample_user, sample_user_data):
        """Test registration with duplicate username."""
        # Try to register with same username
        duplicate_data = sample_user_data.copy()
        duplicate_data["email"] = "different@example.com"
        
        response = client.post("/api/auth/register", json=duplicate_data)
        
        assert response.status_code == 400
        assert "Username already registered" in response.json()["message"]
    
    def test_register_duplicate_email(self, client: TestClient, sample_user, sample_user_data):
        """Test registration with duplicate email."""
        # Try to register with same email
        duplicate_data = sample_user_data.copy()
        duplicate_data["username"] = "differentuser"
        
        response = client.post("/api/auth/register", json=duplicate_data)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["message"]
    
    def test_register_invalid_email(self, client: TestClient, sample_user_data):
        """Test registration with invalid email."""
        invalid_data = sample_user_data.copy()
        invalid_data["email"] = "invalid-email"
        
        response = client.post("/api/auth/register", json=invalid_data)
        
        assert response.status_code == 422


class TestUserLogin:
    """Test user login functionality."""
    
    def test_login_success(self, client: TestClient, sample_user, sample_user_data):
        """Test successful user login."""
        login_data = {
            "username": sample_user_data["username"],
            "password": sample_user_data["password"]
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_username(self, client: TestClient, sample_user):
        """Test login with wrong username."""
        login_data = {
            "username": "wronguser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["message"]
    
    def test_login_wrong_password(self, client: TestClient, sample_user, sample_user_data):
        """Test login with wrong password."""
        login_data = {
            "username": sample_user_data["username"],
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect username or password" in response.json()["message"]


class TestUserProfile:
    """Test user profile functionality."""
    
    def test_get_current_user(self, client: TestClient, auth_headers, sample_user_data):
        """Test getting current user profile."""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == sample_user_data["username"]
        assert data["email"] == sample_user_data["email"]
        assert data["full_name"] == sample_user_data["full_name"]
    
    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 403
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_update_current_user(self, client: TestClient, auth_headers):
        """Test updating current user profile."""
        update_data = {
            "full_name": "Updated Name",
            "email": "updated@example.com"
        }
        
        response = client.put("/api/auth/me", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["email"] == "updated@example.com"
    
    def test_update_current_user_unauthorized(self, client: TestClient):
        """Test updating current user without authentication."""
        update_data = {"full_name": "Updated Name"}
        response = client.put("/api/auth/me", json=update_data)
        
        assert response.status_code == 403


class TestTokenValidation:
    """Test JWT token validation."""
    
    def test_token_expiration_handling(self, client: TestClient):
        """Test handling of expired tokens."""
        # This would require mocking time or using a very short expiration
        # For now, we'll test with an obviously invalid token
        headers = {"Authorization": "Bearer expired.token.here"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_malformed_token(self, client: TestClient):
        """Test handling of malformed tokens."""
        headers = {"Authorization": "Bearer malformed_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
    
    def test_missing_bearer_prefix(self, client: TestClient):
        """Test handling of token without Bearer prefix."""
        headers = {"Authorization": "some_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 403


class TestRoleBasedAccess:
    """Test role-based access control."""
    
    def test_register_with_role(self, client: TestClient, clean_db):
        """Test user registration with specific role."""
        admin_data = {
            "username": "newadmin",
            "email": "newadmin@example.com",
            "full_name": "New Admin",
            "password": "adminpass123",
            "role": "admin"
        }
        
        response = client.post("/api/auth/register", json=admin_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "admin"
    
    def test_admin_get_all_users(self, client: TestClient, admin_auth_headers):
        """Test admin can get all users."""
        response = client.get("/api/auth/users", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the admin user
    
    def test_non_admin_cannot_get_all_users(self, client: TestClient, volunteer_auth_headers):
        """Test non-admin cannot get all users."""
        response = client.get("/api/auth/users", headers=volunteer_auth_headers)
        
        assert response.status_code == 403
        assert "Admin access required" in response.json()["message"]
    
    def test_admin_update_user_role(self, client: TestClient, admin_auth_headers, volunteer_user):
        """Test admin can update user roles."""
        response = client.put(
            f"/api/auth/users/{volunteer_user.user_id}/role",
            params={"new_role": "camp_coordinator"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "camp_coordinator"
    
    def test_non_admin_cannot_update_user_role(self, client: TestClient, volunteer_auth_headers, volunteer_user):
        """Test non-admin cannot update user roles."""
        response = client.put(
            f"/api/auth/users/{volunteer_user.user_id}/role",
            params={"new_role": "admin"},
            headers=volunteer_auth_headers
        )
        
        assert response.status_code == 403
        assert "Admin access required" in response.json()["message"]
    
    def test_update_nonexistent_user_role(self, client: TestClient, admin_auth_headers):
        """Test updating role of nonexistent user."""
        response = client.put(
            "/api/auth/users/99999/role",
            params={"new_role": "admin"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 404
        assert "User not found" in response.json()["message"]