import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from app.middleware import ErrorHandlingMiddleware, RequestLoggingMiddleware
from tests.test_fixtures import *


@pytest.fixture
def test_app_with_middleware():
    """Create a test app with middleware for testing."""
    app = FastAPI()
    
    # Add middleware
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add test routes
    @app.get("/test-success")
    def test_success():
        return {"message": "success"}
    
    @app.get("/test-http-error")
    def test_http_error():
        raise HTTPException(status_code=400, detail="Test HTTP error")
    
    @app.get("/test-server-error")
    def test_server_error():
        raise Exception("Test server error")
    
    @app.post("/test-validation")
    def test_validation(data: dict):
        return data
    
    return app


@pytest.fixture
def middleware_client(test_app_with_middleware):
    """Create test client with middleware."""
    return TestClient(test_app_with_middleware)


class TestErrorHandlingMiddleware:
    """Test error handling middleware functionality."""
    
    def test_successful_request(self, middleware_client):
        """Test that successful requests pass through normally."""
        response = middleware_client.get("/test-success")
        
        assert response.status_code == 200
        assert response.json() == {"message": "success"}
    
    def test_http_exception_handling(self, middleware_client):
        """Test HTTP exception handling."""
        response = middleware_client.get("/test-http-error")
        
        assert response.status_code == 400
        data = response.json()
        assert data["error"] is True
        assert data["message"] == "Test HTTP error"
        assert data["status_code"] == 400
        assert "timestamp" in data
        assert "path" in data
    
    def test_server_error_handling(self, middleware_client):
        """Test general server error handling."""
        response = middleware_client.get("/test-server-error")
        
        assert response.status_code == 500
        data = response.json()
        assert data["error"] is True
        assert data["message"] == "Internal server error"
        assert data["status_code"] == 500
        assert "timestamp" in data
        assert "path" in data
    
    def test_validation_error_handling(self, middleware_client):
        """Test validation error handling."""
        # Send invalid JSON to trigger validation error
        response = middleware_client.post("/test-validation", json="invalid")
        
        assert response.status_code == 422
        data = response.json()
        assert data["error"] is True
        assert data["message"] == "Validation error"
        assert "details" in data
        assert data["status_code"] == 422


class TestRequestLoggingMiddleware:
    """Test request logging middleware functionality."""
    
    def test_request_logging_headers(self, middleware_client):
        """Test that request logging adds timing headers."""
        response = middleware_client.get("/test-success")
        
        assert response.status_code == 200
        assert "X-Process-Time" in response.headers
        
        # Verify timing header is a valid float
        process_time = float(response.headers["X-Process-Time"])
        assert process_time >= 0
    
    def test_request_logging_with_error(self, middleware_client):
        """Test that request logging works even with errors."""
        response = middleware_client.get("/test-http-error")
        
        assert response.status_code == 400
        assert "X-Process-Time" in response.headers