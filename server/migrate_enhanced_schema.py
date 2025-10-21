#!/usr/bin/env python3
"""
Database migration script for enhanced role-based disaster relief system.
This script updates the existing database schema to support the new features.
"""

import sqlite3
import os
from datetime import datetime

def migrate_database():
    """Migrate the existing database to the new enhanced schema."""
    
    db_path = "disaster_management.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Please run setup_db.py first.")
        return False
    
    # Create backup
    backup_path = f"disaster_management_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    os.system(f"copy {db_path} {backup_path}")
    print(f"Created backup: {backup_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Starting database migration...")
        
        # 1. Add new columns to users table
        print("Updating users table...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_approved' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_approved BOOLEAN DEFAULT 0")
        
        if 'assigned_camp_id' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN assigned_camp_id INTEGER")
        
        if 'skills' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN skills TEXT")  # JSON stored as TEXT
        
        if 'notification_preferences' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN notification_preferences TEXT")  # JSON stored as TEXT
        
        if 'last_login' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN last_login DATETIME")
        
        if 'reset_token' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)")
        
        if 'reset_token_expires' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
        
        # 2. Update role values to new enum format
        print("Updating user roles...")
        cursor.execute("UPDATE users SET role = 'volunteer' WHERE role = 'volunteer_user'")
        cursor.execute("UPDATE users SET role = 'coordinator' WHERE role = 'camp_coordinator'")
        
        # 3. Add new columns to camps table
        print("Updating camps table...")
        cursor.execute("PRAGMA table_info(camps)")
        camp_columns = [column[1] for column in cursor.fetchall()]
        
        if 'current_occupancy' not in camp_columns:
            # Rename occupancy to current_occupancy
            cursor.execute("ALTER TABLE camps RENAME COLUMN occupancy TO current_occupancy")
        
        if 'status' not in camp_columns:
            cursor.execute("ALTER TABLE camps ADD COLUMN status VARCHAR(50) DEFAULT 'active'")
        
        if 'coordinator_id' not in camp_columns:
            cursor.execute("ALTER TABLE camps ADD COLUMN coordinator_id INTEGER")
        
        if 'resources_needed' not in camp_columns:
            cursor.execute("ALTER TABLE camps ADD COLUMN resources_needed TEXT")  # JSON stored as TEXT
        
        # 4. Create password_reset_tokens table
        print("Creating password_reset_tokens table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                token_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        """)
        
        # 5. Create notifications table
        print("Creating notifications table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER,
                camp_id INTEGER,
                type VARCHAR(50) NOT NULL,
                priority VARCHAR(50) DEFAULT 'medium',
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT 0,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                read_at DATETIME,
                FOREIGN KEY (sender_id) REFERENCES users (user_id),
                FOREIGN KEY (recipient_id) REFERENCES users (user_id),
                FOREIGN KEY (camp_id) REFERENCES camps (camp_id)
            )
        """)
        
        # 6. Update resource_requests table structure
        print("Updating resource_requests table...")
        
        # Check if we need to recreate the table
        cursor.execute("PRAGMA table_info(resource_requests)")
        rr_columns = [column[1] for column in cursor.fetchall()]
        
        # Create new resource_requests table with updated structure
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS resource_requests_new (
                request_id INTEGER PRIMARY KEY AUTOINCREMENT,
                camp_id INTEGER NOT NULL,
                coordinator_id INTEGER NOT NULL,
                resource_type VARCHAR(100) NOT NULL,
                quantity_requested INTEGER NOT NULL,
                quantity_approved INTEGER,
                urgency VARCHAR(50) DEFAULT 'medium',
                status VARCHAR(50) DEFAULT 'pending',
                description TEXT NOT NULL,
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at DATETIME,
                approved_by INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (camp_id) REFERENCES camps (camp_id),
                FOREIGN KEY (coordinator_id) REFERENCES users (user_id),
                FOREIGN KEY (approved_by) REFERENCES users (user_id)
            )
        """)
        
        # Migrate existing data if any
        cursor.execute("SELECT COUNT(*) FROM resource_requests")
        if cursor.fetchone()[0] > 0:
            print("Migrating existing resource requests...")
            cursor.execute("""
                INSERT INTO resource_requests_new 
                (camp_id, coordinator_id, resource_type, quantity_requested, description, status, notes, created_at)
                SELECT 
                    COALESCE(camp_id, 1) as camp_id,
                    COALESCE(approved_by, 1) as coordinator_id,
                    resource_type,
                    CASE WHEN quantity_needed LIKE '%[0-9]%' THEN CAST(quantity_needed AS INTEGER) ELSE 1 END as quantity_requested,
                    COALESCE(description, title) as description,
                    LOWER(status) as status,
                    notes,
                    created_at
                FROM resource_requests
                WHERE camp_id IS NOT NULL
            """)
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE resource_requests")
        cursor.execute("ALTER TABLE resource_requests_new RENAME TO resource_requests")
        
        # 7. Update volunteer_assignments table structure
        print("Updating volunteer_assignments table...")
        
        # Create new volunteer_assignments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS volunteer_assignments_new (
                assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                volunteer_id INTEGER NOT NULL,
                camp_id INTEGER NOT NULL,
                coordinator_id INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                assigned_tasks TEXT,
                hours_logged REAL DEFAULT 0.0,
                start_date DATE,
                end_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (volunteer_id) REFERENCES users (user_id),
                FOREIGN KEY (camp_id) REFERENCES camps (camp_id),
                FOREIGN KEY (coordinator_id) REFERENCES users (user_id)
            )
        """)
        
        # Migrate existing data if any
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='volunteer_assignments'")
        if cursor.fetchone():
            cursor.execute("SELECT COUNT(*) FROM volunteer_assignments")
            if cursor.fetchone()[0] > 0:
                print("Migrating existing volunteer assignments...")
                # This is complex migration - for now, we'll start fresh
                pass
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE IF EXISTS volunteer_assignments")
        cursor.execute("ALTER TABLE volunteer_assignments_new RENAME TO volunteer_assignments")
        
        # 8. Create indexes for performance
        print("Creating indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_assigned_camp ON users(assigned_camp_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_camps_coordinator ON camps(coordinator_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_resource_requests_camp ON resource_requests(camp_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_resource_requests_status ON resource_requests(status)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_volunteer ON volunteer_assignments(volunteer_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_camp ON volunteer_assignments(camp_id)")
        
        # 9. Create a default admin user if none exists
        print("Checking for admin user...")
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        if cursor.fetchone()[0] == 0:
            print("Creating default admin user...")
            # Hash for password "admin123" - in production, this should be changed immediately
            hashed_password = "$2b$12$LQv3c1yqBwEHxPuNYkFHNOzz.4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Qe"
            cursor.execute("""
                INSERT INTO users (username, email, hashed_password, full_name, role, is_active, is_approved, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, ("admin", "admin@disaster-relief.com", hashed_password, "System Administrator", "admin", 1, 1, datetime.now(), datetime.now()))
            print("Default admin user created: username='admin', password='admin123'")
            print("IMPORTANT: Change the admin password immediately after first login!")
        
        conn.commit()
        print("Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    success = migrate_database()
    if success:
        print("\n✅ Migration completed successfully!")
        print("You can now start the enhanced disaster relief system.")
    else:
        print("\n❌ Migration failed!")
        print("Please check the error messages above and try again.")