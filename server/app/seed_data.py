"""
Seed data for Disaster Management System - India focused demo data
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import hashlib
import random

from app.database import SessionLocal
from app.models import (
    User, UserRole, Disaster, Camp, CampCoordinator, Donation, Volunteer, 
    ResourceRequest, RequestStatus, VolunteerAssignment, VolunteerStatus
)

def hash_password(password: str) -> str:
    """Simple password hashing for demo purposes"""
    # For demo purposes, use simple SHA256 hashing
    # In production, use proper bcrypt
    return hashlib.sha256(password.encode()).hexdigest()

def create_demo_users(db: Session):
    """Create demo admin and user accounts"""
    users = [
        {
            "username": "admin",
            "email": "admin@disaster.gov.in",
            "password_hash": hash_password("admin123"),
            "full_name": "System Administrator",
            "role": UserRole.ADMIN
        },
        {
            "username": "coordinator1",
            "email": "coordinator@ndrf.gov.in",
            "password_hash": hash_password("coord123"),
            "full_name": "NDRF Coordinator",
            "role": UserRole.CAMP_COORDINATOR
        },
        {
            "username": "camp_coord1",
            "email": "coord1@kerala.gov.in",
            "password_hash": hash_password("coord123"),
            "full_name": "Kerala Camp Coordinator",
            "role": UserRole.CAMP_COORDINATOR
        },
        {
            "username": "camp_coord2",
            "email": "coord2@uttarakhand.gov.in",
            "password_hash": hash_password("coord123"),
            "full_name": "Uttarakhand Camp Coordinator",
            "role": UserRole.CAMP_COORDINATOR
        },
        {
            "username": "volunteer_user",
            "email": "volunteer@example.com",
            "password_hash": hash_password("user123"),
            "full_name": "Demo Volunteer User",
            "role": UserRole.USER
        }
    ]
    
    created_users = []
    for user_data in users:
        user = User(**user_data)
        db.add(user)
        db.flush()  # Get the ID
        created_users.append(user)
    
    return created_users

def create_demo_disasters(db: Session, admin_user):
    """Create 5 realistic Indian disasters"""
    disasters_data = [
        {
            "name": "Kerala Floods 2024",
            "type": "Flood",
            "location": "Kochi, Kerala",
            "severity_level": "High",
            "status": "Active",
            "start_date": datetime.now() - timedelta(days=15),
            "description": "Heavy monsoon rains causing severe flooding in Kochi and surrounding areas. Multiple districts affected with thousands displaced.",
            "created_by": admin_user.user_id
        },
        {
            "name": "Uttarakhand Landslide",
            "type": "Landslide",
            "location": "Chamoli, Uttarakhand",
            "severity_level": "Critical",
            "status": "Active",
            "start_date": datetime.now() - timedelta(days=8),
            "description": "Massive landslide in Chamoli district blocking major highways and affecting remote villages.",
            "created_by": admin_user.user_id
        },
        {
            "name": "Rajasthan Drought",
            "type": "Drought",
            "location": "Barmer, Rajasthan",
            "severity_level": "Medium",
            "status": "Ongoing",
            "start_date": datetime.now() - timedelta(days=90),
            "description": "Severe water scarcity affecting agricultural communities in western Rajasthan.",
            "created_by": admin_user.user_id
        },
        {
            "name": "Cyclone Biparjoy Impact",
            "type": "Cyclone",
            "location": "Kutch, Gujarat",
            "severity_level": "High",
            "status": "Recovery",
            "start_date": datetime.now() - timedelta(days=30),
            "end_date": datetime.now() - timedelta(days=25),
            "description": "Post-cyclone recovery operations in coastal Gujarat. Infrastructure damage and rehabilitation ongoing.",
            "created_by": admin_user.user_id
        },
        {
            "name": "Delhi Heat Wave",
            "type": "Heat Wave",
            "location": "New Delhi, Delhi",
            "severity_level": "Medium",
            "status": "Monitoring",
            "start_date": datetime.now() - timedelta(days=5),
            "description": "Extreme temperatures affecting vulnerable populations. Heat stroke cases reported.",
            "created_by": admin_user.user_id
        }
    ]
    
    created_disasters = []
    for disaster_data in disasters_data:
        disaster = Disaster(**disaster_data)
        db.add(disaster)
        db.flush()
        created_disasters.append(disaster)
    
    return created_disasters

def create_demo_camps(db: Session, disasters, admin_user):
    """Create 8-10 relief camps distributed across disasters"""
    camps_data = [
        # Kerala Floods camps
        {
            "name": "Kochi Relief Center",
            "location": "Ernakulam, Kochi",
            "capacity": 500,
            "occupancy": 380,
            "contact_info": "+91-484-2345678",
            "facilities": "Medical aid, Food distribution, Temporary shelter, Sanitation",
            "disaster_id": disasters[0].disaster_id,
            "created_by": admin_user.user_id
        },
        {
            "name": "Alappuzha Emergency Camp",
            "location": "Alappuzha District",
            "capacity": 300,
            "occupancy": 250,
            "contact_info": "+91-477-2234567",
            "facilities": "Emergency shelter, Basic medical care, Food supply",
            "disaster_id": disasters[0].disaster_id,
            "created_by": admin_user.user_id
        },
        
        # Uttarakhand Landslide camps
        {
            "name": "Chamoli Base Camp",
            "location": "Chamoli Town",
            "capacity": 200,
            "occupancy": 150,
            "contact_info": "+91-1372-251234",
            "facilities": "Mountain rescue equipment, Medical team, Communication center",
            "disaster_id": disasters[1].disaster_id,
            "created_by": admin_user.user_id
        },
        {
            "name": "Joshimath Relief Station",
            "location": "Joshimath",
            "capacity": 150,
            "occupancy": 120,
            "contact_info": "+91-1389-222345",
            "facilities": "High altitude medical care, Warm clothing distribution",
            "disaster_id": disasters[1].disaster_id,
            "created_by": admin_user.user_id
        },
        
        # Rajasthan Drought camps
        {
            "name": "Barmer Water Distribution Center",
            "location": "Barmer City",
            "capacity": 100,
            "occupancy": 60,
            "contact_info": "+91-2982-234567",
            "facilities": "Water tankers, Livestock care, Agricultural support",
            "disaster_id": disasters[2].disaster_id,
            "created_by": admin_user.user_id
        },
        
        # Gujarat Cyclone camps
        {
            "name": "Kutch Rehabilitation Center",
            "location": "Bhuj, Kutch",
            "capacity": 400,
            "occupancy": 200,
            "contact_info": "+91-2832-245678",
            "facilities": "Temporary housing, Livelihood support, Infrastructure repair",
            "disaster_id": disasters[3].disaster_id,
            "created_by": admin_user.user_id
        },
        {
            "name": "Mandvi Coastal Relief Camp",
            "location": "Mandvi Port",
            "capacity": 250,
            "occupancy": 180,
            "contact_info": "+91-2834-234567",
            "facilities": "Fishing boat repairs, Coastal community support",
            "disaster_id": disasters[3].disaster_id,
            "created_by": admin_user.user_id
        },
        
        # Delhi Heat Wave camps
        {
            "name": "Delhi Heat Relief Center",
            "location": "Central Delhi",
            "capacity": 300,
            "occupancy": 100,
            "contact_info": "+91-11-23456789",
            "facilities": "Air conditioning, ORS distribution, Medical checkups",
            "disaster_id": disasters[4].disaster_id,
            "created_by": admin_user.user_id
        },
        {
            "name": "East Delhi Community Center",
            "location": "Laxmi Nagar, Delhi",
            "capacity": 200,
            "occupancy": 80,
            "contact_info": "+91-11-22345678",
            "facilities": "Cooling centers, Elderly care, Hydration support",
            "disaster_id": disasters[4].disaster_id,
            "created_by": admin_user.user_id
        }
    ]
    
    created_camps = []
    for camp_data in camps_data:
        camp = Camp(**camp_data)
        db.add(camp)
        db.flush()
        created_camps.append(camp)
    
    return created_camps

def create_demo_camp_coordinators(db: Session, camps, users):
    """Create camp coordinator assignments"""
    # Get coordinator users (skip admin user at index 0)
    coordinator_users = [user for user in users[1:4] if user.role == UserRole.CAMP_COORDINATOR]
    
    coordinators_data = [
        {
            "user_id": coordinator_users[0].user_id,
            "camp_id": camps[0].camp_id,  # Kochi Relief Center
            "responsibilities": "Overall camp management, resource coordination, volunteer supervision",
            "contact_hours": "24/7 emergency contact, office hours 9 AM - 6 PM"
        },
        {
            "user_id": coordinator_users[0].user_id,
            "camp_id": camps[1].camp_id,  # Alappuzha Emergency Camp
            "responsibilities": "Emergency response coordination, medical team liaison",
            "contact_hours": "Emergency calls anytime, regular hours 8 AM - 8 PM"
        },
        {
            "user_id": coordinator_users[1].user_id,
            "camp_id": camps[2].camp_id,  # Chamoli Base Camp
            "responsibilities": "Mountain rescue coordination, equipment management, safety protocols",
            "contact_hours": "Daylight hours 6 AM - 6 PM, emergency contact available"
        },
        {
            "user_id": coordinator_users[1].user_id,
            "camp_id": camps[3].camp_id,  # Joshimath Relief Station
            "responsibilities": "High altitude medical coordination, supply chain management",
            "contact_hours": "Regular hours 7 AM - 7 PM"
        },
        {
            "user_id": coordinator_users[2].user_id,
            "camp_id": camps[4].camp_id,  # Barmer Water Distribution Center
            "responsibilities": "Water resource management, livestock care coordination",
            "contact_hours": "Early morning and evening hours, emergency contact"
        },
        {
            "user_id": coordinator_users[0].user_id,
            "camp_id": camps[7].camp_id,  # Delhi Heat Relief Center
            "responsibilities": "Heat relief operations, medical emergency coordination",
            "contact_hours": "Peak heat hours 10 AM - 6 PM, emergency contact"
        }
    ]
    
    created_coordinators = []
    for coord_data in coordinators_data:
        coordinator = CampCoordinator(**coord_data)
        db.add(coordinator)
        db.flush()
        created_coordinators.append(coordinator)
    
    return created_coordinators

def create_demo_donations(db: Session, disasters):
    """Create 25-30 sample donations (mix of monetary and supplies)"""
    
    # Indian donor names and realistic donation patterns
    donors_data = [
        {"name": "Ravi Sharma", "email": "ravi.sharma@gmail.com", "phone": "+91-9876543210"},
        {"name": "Priya Patel", "email": "priya.patel@yahoo.com", "phone": "+91-9876543211"},
        {"name": "Amit Kumar", "email": "amit.kumar@hotmail.com", "phone": "+91-9876543212"},
        {"name": "Sunita Devi", "email": "sunita.devi@gmail.com", "phone": "+91-9876543213"},
        {"name": "Rajesh Gupta", "email": "rajesh.gupta@rediffmail.com", "phone": "+91-9876543214"},
        {"name": "Meera Singh", "email": "meera.singh@gmail.com", "phone": "+91-9876543215"},
        {"name": "Vikram Yadav", "email": "vikram.yadav@outlook.com", "phone": "+91-9876543216"},
        {"name": "Kavita Joshi", "email": "kavita.joshi@gmail.com", "phone": "+91-9876543217"},
        {"name": "Suresh Reddy", "email": "suresh.reddy@gmail.com", "phone": "+91-9876543218"},
        {"name": "Anita Verma", "email": "anita.verma@yahoo.com", "phone": "+91-9876543219"},
        {"name": "Tata Trusts", "email": "donations@tatatrusts.org", "phone": "+91-22-66658282"},
        {"name": "Reliance Foundation", "email": "help@reliancefoundation.org", "phone": "+91-22-35553555"},
        {"name": "Infosys Foundation", "email": "contact@infosys.com", "phone": "+91-80-28520261"},
        {"name": "Azim Premji Foundation", "email": "info@azimpremjifoundation.org", "phone": "+91-80-61434700"},
    ]
    
    # Donation types common in Indian disaster relief
    monetary_donations = [
        {"type": "Monetary", "amounts": [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]},
    ]
    
    supply_donations = [
        {"type": "Food Supplies", "quantities": ["100 kg rice", "50 kg dal", "200 packets biscuits", "500 water bottles", "100 kg wheat flour"]},
        {"type": "Medical Supplies", "quantities": ["50 first aid kits", "100 ORS packets", "200 masks", "50 thermometers", "Emergency medicines"]},
        {"type": "Clothing", "quantities": ["200 blankets", "100 sarees", "150 shirts", "100 children clothes", "50 winter jackets"]},
        {"type": "Shelter Materials", "quantities": ["20 tarpaulins", "50 plastic sheets", "100 ropes", "Emergency tents", "Construction materials"]},
        {"type": "Water & Sanitation", "quantities": ["10 water purifiers", "500 water bottles", "100 soap bars", "Sanitation kits", "Water storage tanks"]},
    ]
    
    donations_data = []
    
    # Create monetary donations (60% of total)
    for i in range(18):
        donor = random.choice(donors_data)
        disaster = random.choice(disasters)
        amount = random.choice(monetary_donations[0]["amounts"])
        
        donations_data.append({
            "donor_name": donor["name"],
            "donor_email": donor["email"],
            "donor_phone": donor["phone"],
            "donation_type": "Monetary",
            "amount": float(amount),
            "quantity": None,
            "disaster_id": disaster.disaster_id,
            "donation_date": datetime.now() - timedelta(days=random.randint(1, 30)),
            "status": random.choice(["Received", "Processing", "Distributed"])
        })
    
    # Create supply donations (40% of total)
    for i in range(12):
        donor = random.choice(donors_data)
        disaster = random.choice(disasters)
        supply_type = random.choice(supply_donations)
        quantity = random.choice(supply_type["quantities"])
        
        donations_data.append({
            "donor_name": donor["name"],
            "donor_email": donor["email"],
            "donor_phone": donor["phone"],
            "donation_type": supply_type["type"],
            "amount": None,
            "quantity": quantity,
            "disaster_id": disaster.disaster_id,
            "donation_date": datetime.now() - timedelta(days=random.randint(1, 30)),
            "status": random.choice(["Received", "Processing", "Distributed"])
        })
    
    created_donations = []
    for donation_data in donations_data:
        donation = Donation(**donation_data)
        db.add(donation)
        db.flush()
        created_donations.append(donation)
    
    return created_donations

def create_demo_volunteers(db: Session, disasters):
    """Create 30-40 volunteer records with various Indian skills"""
    
    # Indian names and realistic volunteer profiles
    volunteers_data = [
        {"name": "Dr. Arjun Mehta", "email": "arjun.mehta@gmail.com", "phone": "+91-9876501001", "skills": "Medical Doctor, Emergency Medicine, Trauma Care", "availability": "Weekends, Emergency calls"},
        {"name": "Nurse Rekha Sharma", "email": "rekha.sharma@yahoo.com", "phone": "+91-9876501002", "skills": "Nursing, First Aid, Patient Care", "availability": "Full-time available"},
        {"name": "Engineer Sunil Kumar", "email": "sunil.kumar@gmail.com", "phone": "+91-9876501003", "skills": "Civil Engineering, Infrastructure Assessment, Construction", "availability": "After office hours"},
        {"name": "Teacher Priya Jain", "email": "priya.jain@hotmail.com", "phone": "+91-9876501004", "skills": "Education, Child Care, Counseling", "availability": "School holidays, Weekends"},
        {"name": "Chef Ramesh Gupta", "email": "ramesh.gupta@gmail.com", "phone": "+91-9876501005", "skills": "Cooking, Food Distribution, Kitchen Management", "availability": "Flexible timing"},
        {"name": "Driver Vikash Singh", "email": "vikash.singh@rediffmail.com", "phone": "+91-9876501006", "skills": "Heavy Vehicle Driving, Logistics, Transportation", "availability": "24/7 available"},
        {"name": "Social Worker Meera Devi", "email": "meera.devi@gmail.com", "phone": "+91-9876501007", "skills": "Social Work, Community Mobilization, Counseling", "availability": "Weekdays preferred"},
        {"name": "IT Specialist Rohit Agarwal", "email": "rohit.agarwal@outlook.com", "phone": "+91-9876501008", "skills": "IT Support, Communication Systems, Data Management", "availability": "Remote work possible"},
        {"name": "Pharmacist Kavita Reddy", "email": "kavita.reddy@gmail.com", "phone": "+91-9876501009", "skills": "Pharmacy, Medicine Distribution, Health Education", "availability": "Morning shifts"},
        {"name": "Electrician Manoj Yadav", "email": "manoj.yadav@yahoo.com", "phone": "+91-9876501010", "skills": "Electrical Work, Generator Operation, Power Restoration", "availability": "Emergency calls"},
        
        {"name": "Paramedic Anjali Verma", "email": "anjali.verma@gmail.com", "phone": "+91-9876501011", "skills": "Paramedic, Emergency Response, Ambulance Service", "availability": "Shift work"},
        {"name": "Translator Deepak Joshi", "email": "deepak.joshi@gmail.com", "phone": "+91-9876501012", "skills": "Hindi-English Translation, Local Languages, Communication", "availability": "As needed"},
        {"name": "Mechanic Ravi Patel", "email": "ravi.patel@hotmail.com", "phone": "+91-9876501013", "skills": "Vehicle Repair, Equipment Maintenance, Technical Support", "availability": "Daytime hours"},
        {"name": "Counselor Sunita Kapoor", "email": "sunita.kapoor@gmail.com", "phone": "+91-9876501014", "skills": "Psychological Counseling, Trauma Support, Mental Health", "availability": "Flexible schedule"},
        {"name": "Security Guard Ajay Kumar", "email": "ajay.kumar@yahoo.com", "phone": "+91-9876501015", "skills": "Security, Crowd Control, Safety Management", "availability": "Night shifts preferred"},
        
        {"name": "Veterinarian Dr. Pooja Singh", "email": "pooja.singh@gmail.com", "phone": "+91-9876501016", "skills": "Veterinary Care, Animal Rescue, Livestock Management", "availability": "Emergency calls"},
        {"name": "Photographer Amit Sharma", "email": "amit.sharma@outlook.com", "phone": "+91-9876501017", "skills": "Photography, Documentation, Media Support", "availability": "Project basis"},
        {"name": "Accountant Neha Gupta", "email": "neha.gupta@gmail.com", "phone": "+91-9876501018", "skills": "Accounting, Financial Management, Record Keeping", "availability": "Office hours"},
        {"name": "Plumber Suresh Yadav", "email": "suresh.yadav@rediffmail.com", "phone": "+91-9876501019", "skills": "Plumbing, Water Systems, Sanitation", "availability": "Emergency repairs"},
        {"name": "Carpenter Rajesh Kumar", "email": "rajesh.kumar@gmail.com", "phone": "+91-9876501020", "skills": "Carpentry, Shelter Construction, Repair Work", "availability": "Daytime work"},
        
        {"name": "Lawyer Adv. Priyanka Jain", "email": "priyanka.jain@gmail.com", "phone": "+91-9876501021", "skills": "Legal Aid, Documentation, Rights Awareness", "availability": "Consultation hours"},
        {"name": "Physiotherapist Rahul Mehta", "email": "rahul.mehta@yahoo.com", "phone": "+91-9876501022", "skills": "Physiotherapy, Rehabilitation, Mobility Support", "availability": "Clinic hours"},
        {"name": "Student Volunteer Aarti Sharma", "email": "aarti.sharma@gmail.com", "phone": "+91-9876501023", "skills": "General Support, Data Entry, Crowd Management", "availability": "After college"},
        {"name": "Retired Teacher Mohan Lal", "email": "mohan.lal@hotmail.com", "phone": "+91-9876501024", "skills": "Teaching, Elderly Care, Administrative Support", "availability": "Full-time available"},
        {"name": "Housewife Volunteer Sita Devi", "email": "sita.devi@gmail.com", "phone": "+91-9876501025", "skills": "Cooking, Child Care, Women Support", "availability": "Morning hours"},
        
        {"name": "Gym Trainer Vishal Singh", "email": "vishal.singh@outlook.com", "phone": "+91-9876501026", "skills": "Physical Fitness, Rescue Operations, Heavy Lifting", "availability": "Evening hours"},
        {"name": "Shopkeeper Mukesh Agarwal", "email": "mukesh.agarwal@gmail.com", "phone": "+91-9876501027", "skills": "Inventory Management, Supply Distribution, Local Knowledge", "availability": "After business hours"},
        {"name": "Auto Driver Santosh Kumar", "email": "santosh.kumar@yahoo.com", "phone": "+91-9876501028", "skills": "Local Transportation, Area Knowledge, Emergency Transport", "availability": "Flexible timing"},
        {"name": "Bank Employee Nisha Verma", "email": "nisha.verma@gmail.com", "phone": "+91-9876501029", "skills": "Financial Services, Documentation, Computer Skills", "availability": "After office hours"},
        {"name": "Farmer Ramesh Patel", "email": "ramesh.patel@rediffmail.com", "phone": "+91-9876501030", "skills": "Agriculture, Local Resources, Community Leadership", "availability": "Seasonal availability"},
        
        {"name": "College Student Kiran Joshi", "email": "kiran.joshi@gmail.com", "phone": "+91-9876501031", "skills": "Social Media, Youth Mobilization, Event Organization", "availability": "Weekends, Holidays"},
        {"name": "Retired Army Officer Col. Vijay Singh", "email": "vijay.singh@gmail.com", "phone": "+91-9876501032", "skills": "Disaster Management, Leadership, Coordination", "availability": "Full-time available"},
        {"name": "NGO Worker Seema Kapoor", "email": "seema.kapoor@outlook.com", "phone": "+91-9876501033", "skills": "Community Work, Project Management, Fundraising", "availability": "Full-time committed"},
        {"name": "Taxi Driver Gopal Sharma", "email": "gopal.sharma@gmail.com", "phone": "+91-9876501034", "skills": "Transportation, City Navigation, Emergency Services", "availability": "24/7 available"},
        {"name": "Housekeeping Staff Lata Devi", "email": "lata.devi@yahoo.com", "phone": "+91-9876501035", "skills": "Cleaning, Sanitation, Camp Maintenance", "availability": "Morning shifts"},
        
        {"name": "Fire Officer Sunil Yadav", "email": "sunil.yadav@gmail.com", "phone": "+91-9876501036", "skills": "Fire Safety, Rescue Operations, Emergency Response", "availability": "Emergency calls"},
        {"name": "Midwife Kamala Devi", "email": "kamala.devi@hotmail.com", "phone": "+91-9876501037", "skills": "Midwifery, Women Health, Maternal Care", "availability": "On-call basis"},
        {"name": "Watchman Raman Singh", "email": "raman.singh@gmail.com", "phone": "+91-9876501038", "skills": "Security, Night Watch, Property Protection", "availability": "Night shifts"},
    ]
    
    created_volunteers = []
    for i, volunteer_data in enumerate(volunteers_data):
        # Add common fields
        volunteer_data.update({
            "address": f"Address {i+1}, Delhi, India",
            "emergency_contact": f"+91-9876502{i+1:03d}",
            "background_check": random.choice([True, False]),
            "status": VolunteerStatus.PENDING,  # All volunteers start as pending
            "disaster_id": random.choice(disasters).disaster_id if random.choice([True, False]) else None
        })
        
        volunteer = Volunteer(**volunteer_data)
        db.add(volunteer)
        db.flush()
        created_volunteers.append(volunteer)
    
    return created_volunteers


def create_demo_resource_requests(db: Session, disasters, camps, coordinators):
    """Create sample resource requests"""
    
    resource_requests_data = [
        {
            "title": "Emergency Medical Supplies",
            "description": "Urgent need for antibiotics, bandages, and pain relievers for flood victims",
            "resource_type": "Medical",
            "quantity_needed": "500 units of medicines, 200 bandage rolls",
            "priority_level": "Critical",
            "disaster_id": disasters[0].disaster_id,
            "camp_id": camps[0].camp_id,
            "requested_by_coordinator_id": coordinators[0].coordinator_id,
            "status": RequestStatus.PENDING
        },
        {
            "title": "Food Supplies for 200 People",
            "description": "Rice, dal, and cooking oil needed for daily meals",
            "resource_type": "Food",
            "quantity_needed": "100 kg rice, 50 kg dal, 20 liters oil",
            "priority_level": "High",
            "disaster_id": disasters[1].disaster_id,
            "camp_id": camps[2].camp_id,
            "requested_by_coordinator_id": coordinators[2].coordinator_id,
            "status": RequestStatus.APPROVED
        },
        {
            "title": "Water Purification Equipment",
            "description": "Water purifiers needed for safe drinking water",
            "resource_type": "Water",
            "quantity_needed": "10 water purification units",
            "priority_level": "High",
            "disaster_id": disasters[2].disaster_id,
            "camp_id": camps[4].camp_id,
            "requested_by_coordinator_id": coordinators[4].coordinator_id,
            "status": RequestStatus.FULFILLED
        },
        {
            "title": "Temporary Shelter Materials",
            "description": "Tarpaulins and construction materials for temporary shelters",
            "resource_type": "Shelter",
            "quantity_needed": "50 tarpaulins, construction materials",
            "priority_level": "Medium",
            "disaster_id": disasters[3].disaster_id,
            "camp_id": camps[5].camp_id,
            "requested_by_coordinator_id": None,  # Admin request
            "status": RequestStatus.PENDING
        },
        {
            "title": "Cooling Equipment for Heat Relief",
            "description": "Fans and cooling systems for heat wave relief center",
            "resource_type": "Equipment",
            "quantity_needed": "20 ceiling fans, 5 air coolers",
            "priority_level": "High",
            "disaster_id": disasters[4].disaster_id,
            "camp_id": camps[7].camp_id,
            "requested_by_coordinator_id": coordinators[5].coordinator_id,
            "status": RequestStatus.APPROVED
        },
        {
            "title": "Additional Blankets and Warm Clothing",
            "description": "Winter supplies needed for mountain rescue operations",
            "resource_type": "Clothing",
            "quantity_needed": "100 blankets, 50 winter jackets, warm clothing",
            "priority_level": "High",
            "disaster_id": disasters[1].disaster_id,
            "camp_id": camps[3].camp_id,
            "requested_by_coordinator_id": coordinators[3].coordinator_id,
            "status": RequestStatus.PENDING
        }
    ]
    
    created_requests = []
    for request_data in resource_requests_data:
        resource_request = ResourceRequest(**request_data)
        db.add(resource_request)
        db.flush()
        created_requests.append(resource_request)
    
    return created_requests

def create_demo_volunteer_assignments(db: Session, volunteers, camps, disasters, admin_user):
    """Create sample volunteer assignments"""
    
    assignments_data = []
    
    # First, approve some volunteers so they can be assigned
    volunteers_to_assign = [0, 1, 2, 4, 5, 6, 8, 9, 10, 13]  # Indices of volunteers to approve and assign
    
    for idx in volunteers_to_assign:
        if idx < len(volunteers):
            volunteer = volunteers[idx]
            volunteer.status = VolunteerStatus.APPROVED
            volunteer.approved_by = admin_user.user_id
            volunteer.approved_date = datetime.now() - timedelta(days=random.randint(5, 20))
    
    # Also approve some additional volunteers without assignments (available for assignment)
    additional_approved = [14, 15, 16, 17, 18, 19, 20]  # More volunteers to approve but not assign
    for idx in additional_approved:
        if idx < len(volunteers):
            volunteer = volunteers[idx]
            volunteer.status = VolunteerStatus.APPROVED
            volunteer.approved_by = admin_user.user_id
            volunteer.approved_date = datetime.now() - timedelta(days=random.randint(1, 15))
    
    # Assign some volunteers to specific camps with roles
    assignments = [
        {"volunteer_idx": 0, "camp_idx": 0, "role": "Medical Support", "status": "Active"},  # Dr. Arjun to Kochi
        {"volunteer_idx": 1, "camp_idx": 0, "role": "Nursing Care", "status": "Active"},    # Nurse Rekha to Kochi
        {"volunteer_idx": 2, "camp_idx": 1, "role": "Infrastructure Assessment", "status": "Active"},  # Engineer Sunil
        {"volunteer_idx": 4, "camp_idx": 2, "role": "Food Distribution", "status": "Active"},  # Chef Ramesh
        {"volunteer_idx": 5, "camp_idx": 2, "role": "Transportation", "status": "Active"},     # Driver Vikash
        {"volunteer_idx": 6, "camp_idx": 3, "role": "Community Support", "status": "Active"},  # Social Worker Meera
        {"volunteer_idx": 8, "camp_idx": 4, "role": "Medical Support", "status": "Active"},    # Pharmacist Kavita
        {"volunteer_idx": 9, "camp_idx": 5, "role": "Power Restoration", "status": "Completed"},  # Electrician Manoj
        {"volunteer_idx": 10, "camp_idx": 6, "role": "Emergency Response", "status": "Active"},  # Paramedic Anjali
        {"volunteer_idx": 13, "camp_idx": 7, "role": "Counseling Support", "status": "Active"},  # Counselor Sunita
    ]
    
    for assignment in assignments:
        if assignment["volunteer_idx"] < len(volunteers) and assignment["camp_idx"] < len(camps):
            volunteer = volunteers[assignment["volunteer_idx"]]
            camp = camps[assignment["camp_idx"]]
            
            # Update volunteer status to ASSIGNED
            volunteer.status = VolunteerStatus.ASSIGNED
            
            assignment_data = {
                "volunteer_id": volunteer.volunteer_id,
                "camp_id": camp.camp_id,
                "disaster_id": camp.disaster_id,
                "assigned_by": admin_user.user_id,
                "assignment_date": datetime.now() - timedelta(days=random.randint(1, 15)),
                "start_date": datetime.now() - timedelta(days=random.randint(1, 10)),
                "role": assignment["role"],
                "status": assignment["status"],
                "notes": f"Assigned to {camp.name} for {assignment['role'].lower()} duties"
            }
            
            if assignment["status"] == "Completed":
                assignment_data["end_date"] = datetime.now() - timedelta(days=random.randint(1, 5))
                # If assignment is completed, set volunteer back to APPROVED (available for new assignment)
                volunteer.status = VolunteerStatus.APPROVED
            
            assignments_data.append(assignment_data)
    
    created_assignments = []
    for assignment_data in assignments_data:
        volunteer_assignment = VolunteerAssignment(**assignment_data)
        db.add(volunteer_assignment)
        db.flush()
        created_assignments.append(volunteer_assignment)
    
    return created_assignments

def seed_database():
    """Main function to seed the database with demo data"""
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already contains data. Skipping seeding.")
            return
        
        print("🌱 Starting database seeding with Indian disaster management demo data...")
        
        # Create demo data in order (respecting foreign key constraints)
        print("👤 Creating demo users...")
        users = create_demo_users(db)
        admin_user = users[0]  # First user is admin
        
        print("🌪️ Creating disasters...")
        disasters = create_demo_disasters(db, admin_user)
        
        print("🏕️ Creating relief camps...")
        camps = create_demo_camps(db, disasters, admin_user)
        
        print("�‍💼 Crenating camp coordinators...")
        coordinators = create_demo_camp_coordinators(db, camps, users)
        
        print("� CCreating donations...")
        donations = create_demo_donations(db, disasters)
        
        print("� Creatinng volunteers...")
        volunteers = create_demo_volunteers(db, disasters)
        
        print("📋 Creating resource requests...")
        resource_requests = create_demo_resource_requests(db, disasters, camps, coordinators)
        
        print("👥 Creating volunteer assignments...")
        volunteer_assignments = create_demo_volunteer_assignments(db, volunteers, camps, disasters, admin_user)
        
        # Commit all changes
        db.commit()
        
        print("✅ Database seeding completed successfully!")
        print(f"Created:")
        print(f"  - {len(users)} users (including admin and coordinators)")
        print(f"  - {len(disasters)} disasters")
        print(f"  - {len(camps)} relief camps")
        print(f"  - {len(coordinators)} camp coordinators")
        print(f"  - {len(donations)} donations")
        print(f"  - {len(volunteers)} volunteers")
        print(f"  - {len(resource_requests)} resource requests")
        print(f"  - {len(volunteer_assignments)} volunteer assignments")
        
        print("\n🔑 Demo Login Credentials:")
        print("Admin: username='admin', password='admin123'")
        print("Coordinator: username='coordinator1', password='coord123'")
        print("User: username='volunteer_user', password='user123'")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()