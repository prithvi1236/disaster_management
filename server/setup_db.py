#!/usr/bin/env python3
"""
Setup database from within server directory
"""
from app.database import engine
from app.models import Base
from app.seed_data import seed_database

def setup():
    print("🔧 Setting up database...")
    
    try:
        # Create all tables
        print("1. Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Seed demo data
        print("2. Seeding demo data...")
        seed_database()
        print("✅ Demo data seeded successfully")
        
        print("\n🎉 Database setup complete!")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    setup()