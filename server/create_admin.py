#!/usr/bin/env python3
"""
Create an admin user for testing.
"""

from app.database import SessionLocal
from app.models import User, UserRole
from app.auth_utils import get_password_hash
from datetime import datetime

def create_admin_user():
    """Create an admin user."""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin:
            print(f"✅ Admin user already exists: {admin.username}")
            return admin
        
        # Create admin user
        hashed_password = get_password_hash("admin123")
        admin_user = User(
            username="admin",
            email="admin@disaster-relief.com",
            hashed_password=hashed_password,
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True,
            is_approved=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✅ Created admin user: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print("   IMPORTANT: Change this password after first login!")
        
        return admin_user
        
    except Exception as e:
        print(f"❌ Failed to create admin user: {e}")
        db.rollback()
        return None
    
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()