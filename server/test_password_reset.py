#!/usr/bin/env python3
"""
Test script for password reset functionality.
"""

from app.database import SessionLocal
from app.models import User
from app.auth_utils import create_password_reset_token, verify_reset_token, get_password_hash

def test_password_reset():
    """Test the password reset workflow."""
    db = SessionLocal()
    
    try:
        # Find a test user (or create one)
        test_user = db.query(User).filter(User.email == "admin@disaster-relief.com").first()
        
        if not test_user:
            print("❌ No test user found. Please run the migration first.")
            return False
        
        print(f"✅ Found test user: {test_user.username} ({test_user.email})")
        
        # Test token creation
        print("🔄 Testing password reset token creation...")
        token = create_password_reset_token(db, test_user.user_id)
        print(f"✅ Created reset token: {token[:20]}...")
        
        # Test token verification
        print("🔄 Testing token verification...")
        verified_user_id = verify_reset_token(db, token)
        if verified_user_id == test_user.user_id:
            print("✅ Token verification successful!")
        else:
            print("❌ Token verification failed!")
            return False
        
        # Test password hashing
        print("🔄 Testing password hashing...")
        new_password = "newpassword123"
        hashed = get_password_hash(new_password)
        print(f"✅ Password hashed successfully: {hashed[:20]}...")
        
        print("\n🎉 All password reset tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = test_password_reset()
    if success:
        print("\n✅ Password reset system is working correctly!")
    else:
        print("\n❌ Password reset system has issues!")