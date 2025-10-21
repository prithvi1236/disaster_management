#!/usr/bin/env python3
"""
Test database connection and User model
"""
from app.database import SessionLocal
from app.models import User, UserRole
from app.auth_utils import get_password_hash

def test_user_creation():
    """Test creating a user directly"""
    db = SessionLocal()
    
    try:
        print("🧪 Testing User Creation...")
        
        # Try to create a user
        hashed_password = get_password_hash("test123")
        
        test_user = User(
            username="testuser123",
            email="testuser123@example.com",
            full_name="Test User 123",
            hashed_password=hashed_password,
            role=UserRole.USER
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ User created successfully: {test_user.username}")
        print(f"   - ID: {test_user.user_id}")
        print(f"   - Role: {test_user.role}")
        print(f"   - Active: {test_user.is_active}")
        
        # Try to query the user
        found_user = db.query(User).filter(User.username == "testuser123").first()
        if found_user:
            print(f"✅ User found in database: {found_user.username}")
        else:
            print("❌ User not found in database")
            
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_user_creation()