from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole, PasswordResetToken

# Password hashing - using bcrypt for production security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings - import from config
from app.config import settings
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Password reset settings
RESET_TOKEN_EXPIRE_HOURS = 1
MAX_RESET_ATTEMPTS_PER_HOUR = 3

# Email settings (mock for development)
EMAIL_ENABLED = False  # Set to True when email service is configured
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USERNAME = "your-email@gmail.com"
EMAIL_PASSWORD = "your-app-password"

# Security scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    # Use SHA256 for compatibility (in production, use bcrypt)
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password


def get_password_hash(password: str) -> str:
    """Hash a password using SHA256 (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token with role information."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_user_token(user: User) -> str:
    """Create a JWT token for a user with role and permissions."""
    token_data = {
        "sub": user.username,
        "user_id": user.user_id,
        "role": user.role.value,
        "is_approved": user.is_approved,
        "assigned_camp_id": user.assigned_camp_id
    }
    return create_access_token(token_data)


def generate_reset_token() -> str:
    """Generate a secure random token for password reset."""
    return secrets.token_urlsafe(32)


def create_password_reset_token(db: Session, user_id: int) -> str:
    """Create a password reset token for a user."""
    # Check rate limiting
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.created_at > one_hour_ago
    ).count()
    
    if recent_tokens >= MAX_RESET_ATTEMPTS_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset attempts. Please try again later."
        )
    
    # Generate token
    token = generate_reset_token()
    expires_at = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    
    # Save token to database
    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()
    
    return token


def verify_reset_token(db: Session, token: str) -> Optional[int]:
    """Verify a password reset token and return user_id if valid."""
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if not reset_token:
        return None
    
    return reset_token.user_id


def use_reset_token(db: Session, token: str) -> bool:
    """Mark a reset token as used."""
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).first()
    
    if reset_token:
        reset_token.used = True
        db.commit()
        return True
    
    return False


def send_password_reset_email(email: str, token: str, user_name: str) -> bool:
    """Send password reset email (mock implementation for development)."""
    # Mock email sending for development
    print(f"\n📧 Password Reset Email (MOCK)")
    print(f"To: {email}")
    print(f"Subject: Password Reset Request")
    print(f"Hello {user_name},")
    print(f"You requested a password reset. Use this token: {token}")
    print(f"This token expires in {RESET_TOKEN_EXPIRE_HOURS} hour(s).")
    print(f"If you didn't request this, please ignore this email.\n")
    return True


def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return the payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Check token expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
            
        return payload
    except JWTError:
        return None


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user with username and password."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not user.is_active:
        return None
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. Please contact an administrator."
        )
    if not verify_password(password, user.hashed_password):
        return None
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Verify user is still active and approved
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval"
        )
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not current_user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval. Please contact an administrator."
        )
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """Dependency to require specific user roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    return role_checker


def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_coordinator_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a coordinator."""
    if current_user.role != UserRole.COORDINATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coordinator access required"
        )
    return current_user


def get_coordinator_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a coordinator or admin."""
    if current_user.role not in [UserRole.COORDINATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Coordinator or admin access required"
        )
    return current_user


def get_user_or_higher(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current user if they are a volunteer, donor, coordinator, or admin."""
    if current_user.role not in [UserRole.VOLUNTEER, UserRole.DONOR, UserRole.COORDINATOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User access required"
        )
    return current_user


def check_camp_access(current_user: User, camp_id: int) -> bool:
    """Check if user has access to a specific camp."""
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == UserRole.COORDINATOR and current_user.assigned_camp_id == camp_id:
        return True
    return False


def require_camp_access(camp_id: int):
    """Dependency to require access to a specific camp."""
    def camp_access_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not check_camp_access(current_user, camp_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied to camp {camp_id}"
            )
        return current_user
    return camp_access_checker