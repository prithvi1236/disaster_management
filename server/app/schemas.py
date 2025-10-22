from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# Enums matching models.py
class UserRole(str, Enum):
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"
    DONOR = "donor"


class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FULFILLED = "fulfilled"


class AssignmentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class NotificationType(str, Enum):
    SYSTEM = "system"
    CAMP = "camp"
    RESOURCE = "resource"
    VOLUNTEER = "volunteer"
    DONATION = "donation"


class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CampStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    FULL = "full"


class ResourceUrgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# User/Authentication Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: Optional[UserRole] = UserRole.VOLUNTEER
    is_active: Optional[bool] = True


class UserRegistration(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    skills: Optional[List[str]] = None  # For volunteers


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    skills: Optional[List[str]] = None
    notification_preferences: Optional[dict] = None


class UserApproval(BaseModel):
    user_id: int
    approved: bool
    assigned_camp_id: Optional[int] = None  # For coordinators
    rejection_reason: Optional[str] = None  # For rejections


class UserRejection(BaseModel):
    reason: str
    details: Optional[str] = None
    can_reapply: Optional[bool] = True


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str


class User(UserBase):
    user_id: int
    is_approved: bool
    assigned_camp_id: Optional[int] = None
    skills: Optional[List[str]] = None
    notification_preferences: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Error Response Schemas (Person 3)
class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    details: Optional[dict] = None
    timestamp: datetime
    path: str
    status_code: int
    error_code: Optional[str] = None


# Disaster Schemas (Person 1's enhancements)
class DisasterBase(BaseModel):
    name: str
    type: str
    location: str
    severity_level: str
    status: Optional[str] = "Active"
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None


class DisasterCreate(DisasterBase):
    pass  # created_by will be set from authenticated user


class DisasterUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    severity_level: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None


class Disaster(DisasterBase):
    disaster_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Camp Schemas
class CampBase(BaseModel):
    name: str
    location: str
    capacity: int
    current_occupancy: Optional[int] = 0
    status: Optional[CampStatus] = CampStatus.ACTIVE
    coordinator_id: Optional[int] = None
    disaster_id: int
    resources_needed: Optional[dict] = None
    contact_info: Optional[str] = None
    facilities: Optional[str] = None


class CampCreate(CampBase):
    pass  # created_by will be set from authenticated user


class CampUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    status: Optional[CampStatus] = None
    coordinator_id: Optional[int] = None
    disaster_id: Optional[int] = None
    resources_needed: Optional[dict] = None
    contact_info: Optional[str] = None
    facilities: Optional[str] = None


class Camp(CampBase):
    camp_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Donation Schemas
class DonationBase(BaseModel):
    donor_name: Optional[str] = None
    donor_email: Optional[EmailStr] = None
    donor_phone: Optional[str] = None
    donor_contact: Optional[str] = None  # Added for compatibility with frontend
    donation_type: str
    amount: Optional[float] = None
    resource_type: Optional[str] = None  # Added for resource donations
    quantity: Optional[int] = None  # Changed to int for consistency
    disaster_id: Optional[int] = None  # Made optional
    camp_id: Optional[int] = None  # Added for camp-specific donations
    status: Optional[str] = "Received"


class DonationCreate(DonationBase):
    pass


class DonationUpdate(BaseModel):
    donor_name: Optional[str] = None
    donor_email: Optional[EmailStr] = None
    donor_phone: Optional[str] = None
    donor_contact: Optional[str] = None
    donation_type: Optional[str] = None
    amount: Optional[float] = None
    resource_type: Optional[str] = None
    quantity: Optional[int] = None
    disaster_id: Optional[int] = None
    camp_id: Optional[int] = None
    status: Optional[str] = None


class Donation(DonationBase):
    donation_id: int
    donation_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Volunteer Schemas
class VolunteerBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    emergency_contact: Optional[str] = None
    background_check: Optional[bool] = False
    status: Optional[str] = "Active"
    disaster_id: Optional[int] = None


class VolunteerCreate(VolunteerBase):
    pass


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    skills: Optional[str] = None
    availability: Optional[str] = None
    emergency_contact: Optional[str] = None
    background_check: Optional[bool] = None
    status: Optional[str] = None
    disaster_id: Optional[int] = None


class Volunteer(VolunteerBase):
    volunteer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Resource Request Schemas
class ResourceRequestBase(BaseModel):
    camp_id: int
    resource_type: str
    quantity_requested: int
    urgency: Optional[ResourceUrgency] = ResourceUrgency.MEDIUM
    description: str


class ResourceRequestCreate(ResourceRequestBase):
    pass  # coordinator_id will be set from authenticated user


class ResourceRequestUpdate(BaseModel):
    resource_type: Optional[str] = None
    quantity_requested: Optional[int] = None
    quantity_approved: Optional[int] = None
    urgency: Optional[ResourceUrgency] = None
    status: Optional[RequestStatus] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class ResourceRequest(ResourceRequestBase):
    request_id: int
    coordinator_id: int
    quantity_approved: Optional[int] = None
    status: RequestStatus
    requested_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Volunteer Assignment Schemas
class VolunteerAssignmentBase(BaseModel):
    volunteer_id: int
    camp_id: int
    assigned_tasks: Optional[List[str]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class VolunteerAssignmentCreate(VolunteerAssignmentBase):
    pass  # coordinator_id will be set from authenticated user


class VolunteerAssignmentUpdate(BaseModel):
    status: Optional[AssignmentStatus] = None
    assigned_tasks: Optional[List[str]] = None
    hours_logged: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class VolunteerAssignment(VolunteerAssignmentBase):
    assignment_id: int
    coordinator_id: int
    status: AssignmentStatus
    hours_logged: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    recipient_id: Optional[int] = None  # Null for broadcast
    camp_id: Optional[int] = None
    type: NotificationType
    priority: Optional[NotificationPriority] = NotificationPriority.MEDIUM
    title: str
    message: str


class NotificationCreate(NotificationBase):
    pass  # sender_id will be set from authenticated user


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class Notification(NotificationBase):
    notification_id: int
    sender_id: int
    read: bool
    sent_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Response Models with Relations (Person 1)
class DisasterWithRelations(Disaster):
    camps: List[Camp] = []
    donations: List[Donation] = []
    resource_requests: List[ResourceRequest] = []
    created_by_user: Optional[User] = None


class CampWithRelations(Camp):
    disaster: Optional[Disaster] = None
    resource_requests: List[ResourceRequest] = []
    volunteer_assignments: List[VolunteerAssignment] = []
    created_by_user: Optional[User] = None


class VolunteerWithAssignments(Volunteer):
    volunteer_assignments: List[VolunteerAssignment] = []


class UserWithCreations(User):
    created_disasters: List[Disaster] = []
    created_camps: List[Camp] = []
    managed_assignments: List[VolunteerAssignment] = []


# Statistics Schemas (Person 1)
class DashboardStats(BaseModel):
    total_disasters: int
    active_disasters: int
    total_camps: int
    total_volunteers: int
    total_donations: int
    total_donation_amount: float
    pending_resource_requests: int


class DisasterStats(BaseModel):
    disaster_id: int
    disaster_name: str
    total_camps: int
    total_volunteers: int
    total_donations: int
    donation_amount: float
    pending_requests: int


# Admin-specific schemas (Person 1)
class AdminResourceRequestUpdate(BaseModel):
    status: RequestStatus
    approved_by: Optional[int] = None
    notes: Optional[str] = None


class AdminVolunteerAssignmentCreate(BaseModel):
    volunteer_id: int
    disaster_id: int
    camp_id: Optional[int] = None
    role: Optional[str] = None
    start_date: Optional[datetime] = None
    notes: Optional[str] = None