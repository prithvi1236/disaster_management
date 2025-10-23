"""
Database models for the Disaster Management System.

This module defines all SQLAlchemy ORM models representing the core entities
in the disaster management system including users, disasters, camps, volunteers,
donations, and various request types.

The models are designed to support:
- Multi-role user management (Admin, Coordinator, User)
- Disaster tracking and camp coordination
- Volunteer registration and assignment workflow
- Resource and volunteer request management
- Donation tracking and reporting
"""

from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(enum.Enum):
    """
    User role enumeration defining access levels in the system.
    
    - ADMIN: Full system access, can manage all entities
    - USER: Basic user access, can volunteer and donate
    - CAMP_COORDINATOR: Can manage assigned camps and make requests
    """
    ADMIN = "admin"
    USER = "user"
    CAMP_COORDINATOR = "camp_coordinator"


class RequestStatus(enum.Enum):
    """
    Status enumeration for resource and volunteer requests.
    
    - PENDING: Request submitted, awaiting admin review
    - APPROVED: Request approved by admin, ready for fulfillment
    - REJECTED: Request rejected by admin
    - FULFILLED: Request completed and resources/volunteers provided
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"


class VolunteerStatus(enum.Enum):
    """
    Volunteer status enumeration tracking volunteer lifecycle.
    
    - PENDING: Application submitted, awaiting admin approval
    - APPROVED: Approved by admin, available for assignment
    - REJECTED: Application rejected by admin
    - ASSIGNED: Currently assigned to active disaster response
    - INACTIVE: Temporarily inactive or unavailable
    """
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ASSIGNED = "ASSIGNED"
    INACTIVE = "INACTIVE"


class User(Base):
    """
    User model representing system users with role-based access control.
    
    Supports three user roles:
    - Admin: Full system management capabilities
    - Camp Coordinator: Manages assigned relief camps
    - User: Basic access for volunteers and donors
    
    Attributes:
        user_id: Primary key identifier
        username: Unique username for authentication
        email: Unique email address
        password_hash: Hashed password for security
        full_name: User's full display name
        role: User role determining access permissions
        is_active: Account status flag
        created_at: Account creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships - Define what this user has created or manages
    created_disasters = relationship("Disaster", back_populates="created_by_user")
    created_camps = relationship("Camp", back_populates="created_by_user")
    managed_assignments = relationship("VolunteerAssignment", back_populates="assigned_by_user")
    coordinated_camps = relationship("CampCoordinator", back_populates="coordinator_user")
    approved_requests = relationship("ResourceRequest", foreign_keys="ResourceRequest.approved_by", back_populates="approved_by_user")


class Disaster(Base):
    """
    Disaster model representing natural disasters and emergency events.
    
    Tracks disaster events across India including floods, earthquakes, cyclones,
    droughts, and other natural calamities requiring coordinated response.
    
    Attributes:
        disaster_id: Primary key identifier
        name: Descriptive name of the disaster event
        type: Category of disaster (Flood, Earthquake, Cyclone, etc.)
        location: Geographic location affected
        severity_level: Impact assessment (Low, Medium, High, Critical)
        status: Current disaster status (Active, Ongoing, Recovery, Closed)
        start_date: When the disaster event began
        end_date: When the disaster was declared over (optional)
        description: Detailed description of the disaster
        created_by: Admin user who created the disaster record
        created_at: Record creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "disasters"

    disaster_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=False)  # Flood, Earthquake, Cyclone, etc.
    location = Column(String(255), nullable=False)
    severity_level = Column(String(50), nullable=False)  # Low, Medium, High, Critical
    status = Column(String(50), default="Active")  # Active, Ongoing, Recovery, Closed
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships - All entities associated with this disaster
    camps = relationship("Camp", back_populates="disaster", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="disaster")
    resource_requests = relationship("ResourceRequest", back_populates="disaster")
    created_by_user = relationship("User", back_populates="created_disasters")


class Camp(Base):
    """
    Relief camp model representing disaster response camps.
    
    Manages relief camps established for disaster victims, including
    capacity management, facility tracking, and coordinator assignment.
    
    Attributes:
        camp_id: Primary key identifier
        name: Camp name/identifier
        location: Geographic location of the camp
        capacity: Maximum number of people the camp can accommodate
        occupancy: Current number of people in the camp
        contact_info: Contact information for the camp
        facilities: Available facilities and services
        disaster_id: Associated disaster (foreign key)
        created_by: Admin user who created the camp record
        created_at: Camp record creation timestamp
        updated_at: Last modification timestamp
    """
    __tablename__ = "camps"

    camp_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)  # Indexed for search
    location = Column(String(255), nullable=False, index=True)  # Indexed for location queries
    capacity = Column(Integer, nullable=False)
    occupancy = Column(Integer, default=0)
    contact_info = Column(String(255), nullable=True)
    facilities = Column(Text, nullable=True)
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False, index=True)  # Indexed for joins
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)  # Indexed for date queries
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships with proper cascade for data integrity
    disaster = relationship("Disaster", back_populates="camps")
    resource_requests = relationship("ResourceRequest", back_populates="camp", cascade="all, delete-orphan")
    volunteer_assignments = relationship("VolunteerAssignment", back_populates="camp")
    created_by_user = relationship("User", back_populates="created_camps")
    coordinators = relationship("CampCoordinator", back_populates="camp", cascade="all, delete-orphan")


class CampCoordinator(Base):
    __tablename__ = "camp_coordinators"

    coordinator_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=False)
    assigned_date = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    responsibilities = Column(Text, nullable=True)  # Description of coordinator responsibilities
    contact_hours = Column(String(255), nullable=True)  # Available contact hours
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Ensure one coordinator per user (active coordinators only)
    __table_args__ = (
        UniqueConstraint('user_id', 'is_active', name='unique_active_coordinator_per_user'),
    )

    # Relationships
    coordinator_user = relationship("User", back_populates="coordinated_camps")
    camp = relationship("Camp", back_populates="coordinators")
    resource_requests = relationship("ResourceRequest", back_populates="requested_by_coordinator")
    volunteer_requests = relationship("VolunteerRequest", back_populates="requested_by_coordinator")


class Donation(Base):
    __tablename__ = "donations"

    donation_id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String(255), nullable=True)
    donor_email = Column(String(255), nullable=True)
    donor_phone = Column(String(50), nullable=True)
    donation_type = Column(String(100), nullable=False)
    amount = Column(Float, nullable=True)  # For monetary donations
    quantity = Column(String(255), nullable=True)  # For supply donations
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False)
    donation_date = Column(DateTime, server_default=func.now())
    status = Column(String(50), default="Received")
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    disaster = relationship("Disaster", back_populates="donations")


class Volunteer(Base):
    __tablename__ = "volunteers"

    volunteer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    availability = Column(String(255), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    background_check = Column(Boolean, default=False)
    status = Column(Enum(VolunteerStatus), default=VolunteerStatus.PENDING, nullable=False)
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Admin who approved
    approved_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)  # Reason if rejected
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    volunteer_assignments = relationship("VolunteerAssignment", back_populates="volunteer")
    approved_by_user = relationship("User", foreign_keys=[approved_by])


class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    resource_type = Column(String(100), nullable=False)  # Food, Medical, Shelter, etc.
    quantity_needed = Column(String(255), nullable=False)
    priority_level = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    
    # Can be requested for disaster or specific camp
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=True)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=True)
    
    # Who made the request - can be coordinator or admin
    requested_by_coordinator_id = Column(Integer, ForeignKey("camp_coordinators.coordinator_id"), nullable=True)
    requested_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # For admin requests
    
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Admin who approved
    
    request_date = Column(DateTime, server_default=func.now())
    approved_date = Column(DateTime, nullable=True)
    fulfilled_date = Column(DateTime, nullable=True)
    
    notes = Column(Text, nullable=True)  # Admin notes
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    disaster = relationship("Disaster", back_populates="resource_requests")
    camp = relationship("Camp", back_populates="resource_requests")
    requested_by_coordinator = relationship("CampCoordinator", back_populates="resource_requests")
    requested_by_user = relationship("User", foreign_keys=[requested_by_user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by], back_populates="approved_requests")


class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("volunteers.volunteer_id"), nullable=False)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=True)
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False)
    
    assigned_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)  # Admin who assigned
    assignment_date = Column(DateTime, server_default=func.now())
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    
    role = Column(String(100), nullable=True)  # Role assigned (Medical Aid, Food Distribution, etc.)
    status = Column(String(50), default="Active")  # Active, Completed, Cancelled
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    volunteer = relationship("Volunteer", back_populates="volunteer_assignments")
    camp = relationship("Camp", back_populates="volunteer_assignments")
    assigned_by_user = relationship("User", back_populates="managed_assignments")


class VolunteerRequest(Base):
    __tablename__ = "volunteer_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    volunteer_type = Column(String(100), nullable=False)  # Medical, Rescue, Logistics, etc.
    skills_required = Column(Text, nullable=True)  # Specific skills needed
    number_needed = Column(Integer, nullable=False)
    priority_level = Column(String(50), default="Medium")  # Low, Medium, High, Critical
    duration_days = Column(Integer, nullable=True)  # Expected duration in days
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    
    # Camp and disaster info
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=False)
    
    # Who made the request - camp coordinator
    requested_by_coordinator_id = Column(Integer, ForeignKey("camp_coordinators.coordinator_id"), nullable=False)
    
    # Admin approval
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    request_date = Column(DateTime, server_default=func.now())
    approved_date = Column(DateTime, nullable=True)
    fulfilled_date = Column(DateTime, nullable=True)
    
    notes = Column(Text, nullable=True)  # Admin notes
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    disaster = relationship("Disaster")
    camp = relationship("Camp")
    requested_by_coordinator = relationship("CampCoordinator")
    approved_by_user = relationship("User", foreign_keys=[approved_by])