#!/usr/bin/env python3
"""
Database Migration Script

This script updates the existing database schema to match the current models.
"""

import sqlite3
import os
from pathlib import Path

def migrate_database():
    """Migrate the database to the latest schema."""
    db_path = Path("disaster_management.db")
    
    if not db_path.exists():
        print("Database file not found. Please run setup_db.py first.")
        return
    
    print("Starting database migration...")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if new columns exist in donations table
        cursor.execute("PRAGMA table_info(donations)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Current donations columns: {columns}")
        
        # Add missing columns to donations table
        if 'donor_contact' not in columns:
            print("Adding donor_contact column...")
            cursor.execute("ALTER TABLE donations ADD COLUMN donor_contact TEXT")
        
        if 'resource_type' not in columns:
            print("Adding resource_type column...")
            cursor.execute("ALTER TABLE donations ADD COLUMN resource_type TEXT")
        
        if 'camp_id' not in columns:
            print("Adding camp_id column...")
            cursor.execute("ALTER TABLE donations ADD COLUMN camp_id INTEGER REFERENCES camps(camp_id)")
        
        # Update quantity column type (SQLite doesn't support changing column types directly)
        if 'quantity' in columns:
            # Check if quantity is still TEXT type by trying to insert a string
            try:
                cursor.execute("INSERT INTO donations (donor_name, donation_type, quantity) VALUES ('test', 'Resource', 'test_string')")
                cursor.execute("DELETE FROM donations WHERE donor_name = 'test'")
                print("Quantity column is TEXT type - this is acceptable for now")
            except:
                print("Quantity column appears to be INTEGER type already")
        
        # Make disaster_id nullable in donations table
        # SQLite doesn't support modifying column constraints directly
        # We'll handle this in the application logic
        
        # Update donation types to match new schema
        print("Updating donation types...")
        cursor.execute("UPDATE donations SET donation_type = 'Cash' WHERE donation_type = 'Monetary'")
        
        # Update user roles to match new enum values
        print("Updating user roles...")
        cursor.execute("UPDATE users SET role = 'volunteer_user' WHERE role = 'VOLUNTEER_USER'")
        cursor.execute("UPDATE users SET role = 'camp_coordinator' WHERE role = 'CAMP_COORDINATOR'")
        cursor.execute("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'")
        
        # Commit changes
        conn.commit()
        print("Database migration completed successfully!")
        
        # Verify the changes
        cursor.execute("PRAGMA table_info(donations)")
        new_columns = [column[1] for column in cursor.fetchall()]
        print(f"Updated donations columns: {new_columns}")
        
    except Exception as e:
        print(f"Migration error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()