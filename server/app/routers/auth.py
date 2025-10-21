from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserRole
from app.schemas import (
    UserRegistration, UserLogin, User as UserSchema, Token, UserUpdate, 
    UserApproval, PasswordResetRequest, PasswordReset
)
from typing import List
from app.auth_utils import (
    get_password_hash, 
    authenticate_user, 
    create_access_token,
    create_user_token,
    get_current_active_user,
    get_admin_user,
    create_password_reset_token,
    verify_reset_token,
    use_reset_token,
    send_password_reset_email,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=UserSchema)
def register_user(user: UserRegistration, db: Session = Depends(get_db)):
    """Register a new user (requires admin approval)."""
    # Validate input data
    if not user.username or len(user.username.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )
    
    if not user.full_name or len(user.full_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters long"
        )
    
    if not user.password or len(user.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Sanitize input
    username = user.username.strip().lower()
    email = user.email.strip().lower()
    full_name = user.full_name.strip()
    
    # Check if username already exists
    db_user = db.query(User).filter(User.username == username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    db_user = db.query(User).filter(User.email == email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user (pending approval)
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hashed_password,
        role=user.role,
        skills=user.skills,
        is_approved=False  # Requires admin approval
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token with role information."""
    user = authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_user_token(user)
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/password-reset/request")
def request_password_reset(
    reset_request: PasswordResetRequest, 
    db: Session = Depends(get_db)
):
    """Request a password reset token."""
    # Find user by email
    user = db.query(User).filter(User.email == reset_request.email.lower()).first()
    
    # Always return success for security (don't reveal if email exists)
    if user:
        try:
            token = create_password_reset_token(db, user.user_id)
            send_password_reset_email(user.email, token, user.full_name)
        except HTTPException:
            # Rate limiting hit, but still return success
            pass
    
    return {"message": "If the email exists, a password reset token has been sent"}


@router.post("/password-reset/confirm")
def confirm_password_reset(
    reset_data: PasswordReset,
    db: Session = Depends(get_db)
):
    """Confirm password reset with token."""
    # Verify token
    user_id = verify_reset_token(db, reset_data.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Validate new password
    if not reset_data.new_password or len(reset_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Update user password
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(reset_data.new_password)
    
    # Mark token as used
    use_reset_token(db, reset_data.token)
    
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserSchema)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserSchema)
def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    # Check if username is being changed and if it's already taken
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(User.username == user_update.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/users", response_model=List[UserSchema])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    pending_only: bool = False,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)."""
    query = db.query(User)
    
    if pending_only:
        query = query.filter(User.is_approved == False)
    
    users = query.offset(skip).limit(limit).all()
    return users


@router.post("/users/{user_id}/approve", response_model=UserSchema)
def approve_user(
    user_id: int,
    approval_data: UserApproval,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Approve or reject user registration (admin only)."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_approved = approval_data.approved
    
    # If approving a coordinator, assign them to a camp
    if approval_data.approved and user.role == UserRole.COORDINATOR and approval_data.assigned_camp_id:
        user.assigned_camp_id = approval_data.assigned_camp_id
    
    db.commit()
    db.refresh(user)
    
    return user


@router.put("/users/{user_id}/role", response_model=UserSchema)
def update_user_role(
    user_id: int,
    new_role: UserRole,
    admin_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = new_role
    
    db.commit()
    db.refresh(user)
    
    return user