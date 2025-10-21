"""
Simple seed data for Disaster Management System
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import hashlib

from app.database import SessionLocal
from app.models import User, UserRole, Disaster, Camp, Donation, CampStatus

def hash_password(password: str) -> str:
    """Simple password hashing for demo"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_simple_demo_data():
    """Create simple demo data for testing"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Demo data already exists, skipping...")
            return
        
        print("Creating simple demo data...")
        
        # Create users
        users_data = [
            {
                "username": "admin",
                "email": "admin@disaster.gov.in",
                "hashed_password": hash_password("admin123"),
                "full_name": "System Administrator",
                "role": UserRole.ADMIN,
                "is_approved": True
            },
            {
                "username": "coordinator1",
                "email": "coordinator@ndrf.gov.in",
                "hashed_password": hash_password("coord123"),
                "full_name": "Camp Coordinator",
                "role": UserRole.COORDINATOR,
                "is_approved": True
            },
            {
                "username": "volunteer1",
                "email": "volunteer@example.com",
                "hashed_password": hash_password("vol123"),
                "full_name": "Volunteer User",
                "role": UserRole.VOLUNTEER,
                "is_approved": True,
                "skills": ["First Aid", "Food Distribution"]
            },
            {
                "username": "donor1",
                "email": "donor@example.com",
                "hashed_password": hash_password("donor123"),
                "full_name": "Donor User",
                "role": UserRole.DONOR,
                "is_approved": True
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user = User(**user_data)
            db.add(user)
            db.flush()
            created_users.append(user)
            print(f"Created user: {user.username} ({user.role.value})")
        
        # Create disasters
        disasters_data = [
            {
                "name": "Kerala Floods 2024",
                "type": "Flood",
                "location": "Kerala, India",
                "severity_level": "High",
                "status": "Active",
                "start_date": datetime.now() - timedelta(days=5),
                "description": "Severe flooding in Kerala due to heavy monsoon rains",
                "created_by": created_users[0].user_id  # Admin
            },
            {
                "name": "Delhi Earthquake",
                "type": "Earthquake",
                "location": "Delhi, India",
                "severity_level": "Medium",
                "status": "Active",
                "start_date": datetime.now() - timedelta(days=2),
                "description": "Moderate earthquake in Delhi NCR region",
                "created_by": created_users[0].user_id  # Admin
            }
        ]
        
        created_disasters = []
        for disaster_data in disasters_data:
            disaster = Disaster(**disaster_data)
            db.add(disaster)
            db.flush()
            created_disasters.append(disaster)
            print(f"Created disaster: {disaster.name}")
        
        # Create camps
        camps_data = [
            {
                "name": "Kochi Relief Camp",
                "location": "Kochi, Kerala",
                "capacity": 500,
                "current_occupancy": 350,
                "status": CampStatus.ACTIVE,
                "disaster_id": created_disasters[0].disaster_id,
                "coordinator_id": created_users[1].user_id,  # Coordinator
                "created_by": created_users[0].user_id,  # Admin
                "resources_needed": {"food": 100, "blankets": 200, "medicine": 50}
            },
            {
                "name": "Delhi Emergency Shelter",
                "location": "Delhi, India",
                "capacity": 300,
                "current_occupancy": 150,
                "status": CampStatus.ACTIVE,
                "disaster_id": created_disasters[1].disaster_id,
                "created_by": created_users[0].user_id,  # Admin
                "resources_needed": {"tents": 50, "food": 200, "water": 1000}
            }
        ]
        
        created_camps = []
        for camp_data in camps_data:
            camp = Camp(**camp_data)
            db.add(camp)
            db.flush()
            created_camps.append(camp)
            print(f"Created camp: {camp.name}")
        
        # Assign coordinator to their camp
        created_users[1].assigned_camp_id = created_camps[0].camp_id
        
        # Create sample donations
        donations_data = [
            {
                "donor_name": "Anonymous Donor",
                "donor_email": "donor@example.com",
                "donation_type": "Money",
                "amount": 50000.0,
                "disaster_id": created_disasters[0].disaster_id,
                "camp_id": created_camps[0].camp_id
            },
            {
                "donor_name": "Relief Organization",
                "donor_email": "relief@ngo.org",
                "donation_type": "Supplies",
                "resource_type": "Blankets",
                "quantity": 100,
                "disaster_id": created_disasters[0].disaster_id
            }
        ]
        
        for donation_data in donations_data:
            donation = Donation(**donation_data)
            db.add(donation)
            print(f"Created donation: {donation.donation_type}")
        
        db.commit()
        print("✅ Simple demo data created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating demo data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_demo_data()