from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean, Enum, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(enum.Enum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"
    DONOR = "donor"


class RequestStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FULFILLED = "fulfilled"


class AssignmentStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class NotificationType(enum.Enum):
    SYSTEM = "system"
    CAMP = "camp"
    RESOURCE = "resource"
    VOLUNTEER = "volunteer"
    DONATION = "donation"


class NotificationPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CampStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    FULL = "full"


class ResourceUrgency(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VOLUNTEER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # Admin approval required
    assigned_camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=True)  # For coordinators
    skills = Column(JSON, nullable=True)  # For volunteers
    notification_preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Password Reset fields
    reset_token = Column(String(255), nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Relationships
    created_disasters = relationship("Disaster", foreign_keys="Disaster.created_by", back_populates="created_by_user")
    created_camps = relationship("Camp", foreign_keys="Camp.created_by", back_populates="created_by_user")
    managed_assignments = relationship("VolunteerAssignment", foreign_keys="VolunteerAssignment.coordinator_id", back_populates="assigned_by_user")
    assigned_camp = relationship("Camp", foreign_keys=[assigned_camp_id], post_update=True)
    coordinated_camps = relationship("Camp", foreign_keys="Camp.coordinator_id", back_populates="coordinator")
    volunteer_assignments = relationship("VolunteerAssignment", foreign_keys="VolunteerAssignment.volunteer_id", back_populates="volunteer")
    sent_notifications = relationship("Notification", foreign_keys="Notification.sender_id", back_populates="sender")
    received_notifications = relationship("Notification", foreign_keys="Notification.recipient_id", back_populates="recipient")
    resource_requests = relationship("ResourceRequest", foreign_keys="ResourceRequest.coordinator_id", back_populates="coordinator")
    approved_requests = relationship("ResourceRequest", foreign_keys="ResourceRequest.approved_by", back_populates="approver")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    token_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")


class Disaster(Base):
    __tablename__ = "disasters"

    disaster_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    severity_level = Column(String(50), nullable=False)
    status = Column(String(50), default="Active")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Person 1's enhancement
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    camps = relationship("Camp", back_populates="disaster")
    donations = relationship("Donation", back_populates="disaster")
    created_by_user = relationship("User", back_populates="created_disasters")


class Camp(Base):
    __tablename__ = "camps"

    camp_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0)
    status = Column(Enum(CampStatus), default=CampStatus.ACTIVE)
    coordinator_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False)
    resources_needed = Column(JSON, nullable=True)
    contact_info = Column(String(255), nullable=True)
    facilities = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    disaster = relationship("Disaster", back_populates="camps")
    coordinator = relationship("User", foreign_keys=[coordinator_id], back_populates="coordinated_camps")
    donations = relationship("Donation", back_populates="camp")
    resource_requests = relationship("ResourceRequest", back_populates="camp")
    volunteer_assignments = relationship("VolunteerAssignment", back_populates="camp")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_camps")
    notifications = relationship("Notification", back_populates="camp")


class Donation(Base):
    __tablename__ = "donations"

    donation_id = Column(Integer, primary_key=True, index=True)
    donor_name = Column(String(255), nullable=True)
    donor_email = Column(String(255), nullable=True)
    donor_phone = Column(String(50), nullable=True)
    donor_contact = Column(String(255), nullable=True)  # Added for compatibility
    donation_type = Column(String(100), nullable=False)
    amount = Column(Float, nullable=True)  # For monetary donations
    resource_type = Column(String(100), nullable=True)  # For resource donations
    quantity = Column(Integer, nullable=True)  # Changed to Integer for consistency
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=True)  # Made optional
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=True)  # Added for camp-specific donations
    donation_date = Column(DateTime, server_default=func.now())
    status = Column(String(50), default="Received")
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    disaster = relationship("Disaster", back_populates="donations")
    camp = relationship("Camp", back_populates="donations")


# Volunteer model removed - volunteers are now Users with role=VOLUNTEER


class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=False)
    coordinator_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    resource_type = Column(String(100), nullable=False)
    quantity_requested = Column(Integer, nullable=False)
    quantity_approved = Column(Integer, nullable=True)
    urgency = Column(Enum(ResourceUrgency), default=ResourceUrgency.MEDIUM)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False)
    description = Column(Text, nullable=False)
    requested_at = Column(DateTime, server_default=func.now())
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    camp = relationship("Camp", back_populates="resource_requests")
    coordinator = relationship("User", foreign_keys=[coordinator_id], back_populates="resource_requests")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_requests")


class VolunteerAssignment(Base):
    __tablename__ = "volunteer_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=False)
    coordinator_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.PENDING)
    assigned_tasks = Column(JSON, nullable=True)
    hours_logged = Column(Float, default=0.0)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    volunteer = relationship("User", foreign_keys=[volunteer_id], back_populates="volunteer_assignments")
    camp = relationship("Camp", back_populates="volunteer_assignments")
    assigned_by_user = relationship("User", foreign_keys=[coordinator_id], back_populates="managed_assignments")


class Notification(Base):
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)  # Null for broadcast
    camp_id = Column(Integer, ForeignKey("camps.camp_id"), nullable=True)  # Camp-specific notifications
    type = Column(Enum(NotificationType), nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    sent_at = Column(DateTime, server_default=func.now())
    read_at = Column(DateTime, nullable=True)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_notifications")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_notifications")
    camp = relationship("Camp", back_populates="notifications")
