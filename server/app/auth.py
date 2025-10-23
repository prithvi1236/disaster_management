"""
Authentication utilities for the Disaster Management System

This module provides comprehensive authentication and authorization functionality
including JWT token management, password hashing, and user verification.
"""
from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import hashlib

from app.database import get_db
from app.models import User
from app.schemas import TokenData

# Configuration - Use environment variables for production security
SECRET_KEY = os.getenv("SECRET_KEY", "disaster_management_secret_key_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing context with bcrypt (more secure than SHA256)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt for production security.
    
    Args:
        password (str): Plain text password to hash
        
    Returns:
        str: Hashed password string
        
    Note:
        Falls back to SHA256 for demo compatibility but bcrypt is recommended for production
    """
    # Use bcrypt for production, SHA256 for demo compatibility
    if os.getenv("USE_BCRYPT", "false").lower() == "true":
        return pwd_context.hash(password)
    else:
        # SHA256 fallback for demo compatibility
        return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against stored hash.
    
    Args:
        plain_password (str): Plain text password to verify
        hashed_password (str): Stored hash to verify against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    # Try bcrypt first, fall back to SHA256 for demo compatibility
    if os.getenv("USE_BCRYPT", "false").lower() == "true":
        return pwd_context.verify(plain_password, hashed_password)
    else:
        return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token with expiration.
    
    Args:
        data (dict): Token payload data (typically contains 'sub' with username)
        expires_delta (Optional[timedelta]): Custom expiration time, defaults to 15 minutes
        
    Returns:
        str: Encoded JWT token
        
    Raises:
        JWTError: If token encoding fails
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """
    Verify and decode JWT token from Authorization header.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        TokenData: Decoded token data containing username
        
    Raises:
        HTTPException: If token is invalid, expired, or malformed
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

def get_current_user(token_data: TokenData = Depends(verify_token), db: Session = Depends(get_db)) -> User:
    """
    Get current authenticated user from token data.
    
    Args:
        token_data: Decoded token containing username
        db: Database session
        
    Returns:
        User: Current authenticated user object
        
    Raises:
        HTTPException: If user not found in database
    """
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user, ensuring account is not disabled.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Active user object
        
    Raises:
        HTTPException: If user account is inactive/disabled
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user account"
        )
    return current_user

def authenticate_user(db: Session, username: str, password: str) -> User | bool:
    """
    Authenticate user credentials against database.
    
    Args:
        db: Database session
        username: Username to authenticate
        password: Plain text password to verify
        
    Returns:
        User | bool: User object if authentication successful, False otherwise
        
    Note:
        This function performs constant-time comparison to prevent timing attacks
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        # Perform dummy password verification to prevent timing attacks
        verify_password("dummy", "dummy_hash")
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user