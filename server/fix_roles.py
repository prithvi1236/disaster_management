#!/usr/bin/env python3
"""
Fix user roles in database to match new enum values.
"""

import sqlite3

def fix_user_roles():
    """Update user roles to match new enum values."""
    conn = sqlite3.connect('disaster_management.db')
    cursor = conn.cursor()
    
    try:
        # Update role values to match new enum
        cursor.execute('UPDATE users SET role = "ADMIN" WHERE role = "admin"')
        cursor.execute('UPDATE users SET role = "COORDINATOR" WHERE role = "coordinator"')
        cursor.execute('UPDATE users SET role = "VOLUNTEER" WHERE role = "volunteer"')
        cursor.execute('UPDATE users SET role = "DONOR" WHERE role = "donor"')
        
        # Set default approval for existing users
        cursor.execute('UPDATE users SET is_approved = 1 WHERE is_approved IS NULL')
        
        conn.commit()
        
        # Check results
        cursor.execute('SELECT username, email, role, is_approved FROM users')
        users = cursor.fetchall()
        
        print("✅ Updated user roles successfully!")
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"- {user[0]} ({user[1]}) - Role: {user[2]}, Approved: {user[3]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to update roles: {e}")
        conn.rollback()
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    fix_user_roles()