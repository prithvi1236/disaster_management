import time
import logging
from datetime import datetime
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from app.schemas import ErrorResponse

# Configure logging
import os
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as exc:
            return await self.handle_http_exception(request, exc)
        except RequestValidationError as exc:
            return await self.handle_validation_error(request, exc)
        except SQLAlchemyError as exc:
            return await self.handle_database_error(request, exc)
        except Exception as exc:
            return await self.handle_general_error(request, exc)
    
    async def handle_http_exception(self, request: Request, exc: HTTPException) -> JSONResponse:
        """Handle HTTP exceptions."""
        error_response = ErrorResponse(
            message=exc.detail,
            timestamp=datetime.utcnow(),
            path=str(request.url),
            status_code=exc.status_code
        )
        
        logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail} - Path: {request.url}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.model_dump(mode='json')
        )
    
    async def handle_validation_error(self, request: Request, exc: RequestValidationError) -> JSONResponse:
        """Handle validation errors."""
        error_details = {}
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            error_details[field] = error["msg"]
        
        error_response = ErrorResponse(
            message="Validation error",
            details=error_details,
            timestamp=datetime.utcnow(),
            path=str(request.url),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )
        
        logger.warning(f"Validation Error: {error_details} - Path: {request.url}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response.model_dump(mode='json')
        )
    
    async def handle_database_error(self, request: Request, exc: SQLAlchemyError) -> JSONResponse:
        """Handle database errors."""
        error_response = ErrorResponse(
            message="Database error occurred",
            timestamp=datetime.utcnow(),
            path=str(request.url),
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )
        
        logger.error(f"Database Error: {str(exc)} - Path: {request.url}")
        
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_response.model_dump(mode='json')
        )
    
    async def handle_general_error(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle general exceptions."""
        error_response = ErrorResponse(
            message="Internal server error",
            timestamp=datetime.utcnow(),
            path=str(request.url),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        logger.error(f"General Error: {str(exc)} - Path: {request.url}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.model_dump(mode='json')
        )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Request and response logging middleware."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url}")
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {response.status_code} - "
            f"Time: {process_time:.4f}s - "
            f"Path: {request.url.path}"
        )
        
        # Add timing header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for protected routes."""
    
    # Routes that don't require authentication
    EXCLUDED_PATHS = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/password-reset",
        "/api/auth/confirm-reset",
        "/health",
        "/",
        "/api/disasters",  # Public disaster info
        "/api/camps"       # Public camp info
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # Check for Authorization header on protected routes
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "message": "Missing or invalid authorization header",
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": str(request.url),
                    "status_code": 401
                }
            )
        
        # Extract and validate token
        token = auth_header.split(" ")[1]
        from app.auth_utils import verify_token
        
        payload = verify_token(token)
        if payload is None:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "message": "Invalid or expired token",
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": str(request.url),
                    "status_code": 401
                }
            )
        
        # Add user info to request state for use in endpoints
        request.state.token_payload = payload
        
        return await call_next(request)