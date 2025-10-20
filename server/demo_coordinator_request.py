#!/usr/bin/env python3
"""
Demo script showing how a Camp Coordinator can create resource requests
"""

from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import (
    User, UserRole, CampCoordinator, ResourceRequest, 
    RequestStatus, Camp, Disaster
)

def demo_coordinator_resource_request():
    """Demonstrate how a camp coordinator creates a resource request"""
    db = SessionLocal()
    
    try:
        print("🏕️ Camp Coordinator Resource Request Demo")
        print("=" * 50)
        
        # Find a camp coordinator
        coordinator = db.query(CampCoordinator).first()
        if not coordinator:
            print("❌ No camp coordinators found. Please run seed_data.py first.")
            return
        
        # Get coordinator user details
        coordinator_user = db.query(User).filter(
            User.user_id == coordinator.user_id
        ).first()
        
        # Get camp details
        camp = db.query(Camp).filter(
            Camp.camp_id == coordinator.camp_id
        ).first()
        
        print(f"👨‍💼 Coordinator: {coordinator_user.full_name}")
        print(f"📧 Email: {coordinator_user.email}")
        print(f"🏕️ Managing Camp: {camp.name}")
        print(f"📍 Location: {camp.location}")
        print(f"👥 Occupancy: {camp.occupancy}/{camp.capacity}")
        print()
        
        # Create a new resource request
        new_request = ResourceRequest(
            title="Emergency Generator for Power Outage",
            description="Our camp has experienced a power outage due to damaged electrical lines. We urgently need a backup generator to maintain essential services including medical equipment, lighting, and communication systems.",
            resource_type="Equipment",
            quantity_needed="1 diesel generator (15 KVA capacity), fuel for 48 hours operation",
            priority_level="Critical",
            disaster_id=camp.disaster_id,
            camp_id=camp.camp_id,
            requested_by_coordinator_id=coordinator.coordinator_id,
            status=RequestStatus.PENDING,
            notes="Power outage affecting medical equipment and communication. Generator needed within 6 hours."
        )
        
        # Add to database
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        print("✅ Resource Request Created Successfully!")
        print(f"🆔 Request ID: {new_request.request_id}")
        print(f"📋 Title: {new_request.title}")
        print(f"🔧 Resource Type: {new_request.resource_type}")
        print(f"⚠️ Priority: {new_request.priority_level}")
        print(f"📊 Status: {new_request.status.value}")
        print(f"📅 Request Date: {new_request.request_date}")
        print()
        
        # Show all requests by this coordinator
        print("📋 All Resource Requests by this Coordinator:")
        print("-" * 50)
        
        all_requests = db.query(ResourceRequest).filter(
            ResourceRequest.requested_by_coordinator_id == coordinator.coordinator_id
        ).all()
        
        for i, request in enumerate(all_requests, 1):
            print(f"{i}. {request.title}")
            print(f"   Type: {request.resource_type} | Priority: {request.priority_level}")
            print(f"   Status: {request.status.value} | Date: {request.request_date.strftime('%Y-%m-%d %H:%M')}")
            print(f"   Quantity: {request.quantity_needed}")
            print()
        
        # Show coordinator responsibilities
        print("👨‍💼 Coordinator Responsibilities:")
        print("-" * 30)
        print(f"📝 {coordinator.responsibilities}")
        print(f"📞 Contact Hours: {coordinator.contact_hours}")
        print(f"📅 Assigned Since: {coordinator.assigned_date.strftime('%Y-%m-%d')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

def list_all_coordinators():
    """List all camp coordinators and their camps"""
    db = SessionLocal()
    
    try:
        print("\n🏕️ All Camp Coordinators")
        print("=" * 50)
        
        coordinators = db.query(CampCoordinator).join(User).join(Camp).all()
        
        for i, coordinator in enumerate(coordinators, 1):
            user = coordinator.coordinator_user
            camp = coordinator.camp
            
            print(f"{i}. {user.full_name} ({user.username})")
            print(f"   📧 {user.email}")
            print(f"   🏕️ Managing: {camp.name}")
            print(f"   📍 Location: {camp.location}")
            print(f"   👥 Occupancy: {camp.occupancy}/{camp.capacity}")
            print(f"   📅 Assigned: {coordinator.assigned_date.strftime('%Y-%m-%d')}")
            print(f"   ✅ Active: {'Yes' if coordinator.is_active else 'No'}")
            print()
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

def show_coordinator_workflow():
    """Show the typical workflow for a camp coordinator"""
    print("\n🔄 Camp Coordinator Workflow")
    print("=" * 40)
    print("1. 👨‍💼 Coordinator is assigned to a camp")
    print("2. 🔍 Monitor camp resources and needs")
    print("3. 📋 Identify resource shortages or requirements")
    print("4. ✍️ Create resource request with details:")
    print("   - Title and description")
    print("   - Resource type (Medical, Food, Equipment, etc.)")
    print("   - Quantity needed")
    print("   - Priority level (Low, Medium, High, Critical)")
    print("   - Associated camp and disaster")
    print("5. 📤 Submit request for admin approval")
    print("6. ⏳ Wait for approval and fulfillment")
    print("7. ✅ Receive and distribute resources")
    print("8. 📊 Update camp status and occupancy")

if __name__ == "__main__":
    print("🚀 Starting Camp Coordinator Demo...")
    
    # Show workflow
    show_coordinator_workflow()
    
    # List all coordinators
    list_all_coordinators()
    
    # Demo creating a resource request
    demo_coordinator_resource_request()
    
    print("\n✨ Demo completed!")
    print("\n💡 Key Features Implemented:")
    print("- Camp Coordinator entity with user relationship")
    print("- Resource requests linked to coordinators")
    print("- Multiple coordinators can manage different camps")
    print("- Coordinators can create requests with full details")
    print("- Proper tracking of who requested what and when")