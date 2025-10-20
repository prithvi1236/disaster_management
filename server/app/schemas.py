from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum


# Enums matching models.py
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    CAMP_COORDINATOR = "camp_coordinator"


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FULFILLED = "FULFILLED"


# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: Optional[UserRole] = UserRole.USER
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str  # Plain password (will be hashed)


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Plain password (will be hashed)


class User(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Disaster Schemas
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
    occupancy: Optional[int] = 0
    contact_info: Optional[str] = None
    facilities: Optional[str] = None
    disaster_id: int


class CampCreate(CampBase):
    pass  # created_by will be set from authenticated user


class CampUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    contact_info: Optional[str] = None
    facilities: Optional[str] = None
    disaster_id: Optional[int] = None


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
    donation_type: str
    amount: Optional[float] = None
    quantity: Optional[str] = None
    disaster_id: int
    status: Optional[str] = "Received"


class DonationCreate(DonationBase):
    pass


class DonationUpdate(BaseModel):
    donor_name: Optional[str] = None
    donor_email: Optional[EmailStr] = None
    donor_phone: Optional[str] = None
    donation_type: Optional[str] = None
    amount: Optional[float] = None
    quantity: Optional[str] = None
    disaster_id: Optional[int] = None
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


# Camp Coordinator Schemas
class CampCoordinatorBase(BaseModel):
    user_id: int
    camp_id: int
    responsibilities: Optional[str] = None
    contact_hours: Optional[str] = None
    is_active: Optional[bool] = True


class CampCoordinatorCreate(CampCoordinatorBase):
    pass


class CampCoordinatorUpdate(BaseModel):
    responsibilities: Optional[str] = None
    contact_hours: Optional[str] = None
    is_active: Optional[bool] = None


class CampCoordinator(CampCoordinatorBase):
    coordinator_id: int
    assigned_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Resource Request Schemas
class ResourceRequestBase(BaseModel):
    title: str
    description: str
    resource_type: str
    quantity_needed: str
    priority_level: Optional[str] = "Medium"
    disaster_id: Optional[int] = None
    camp_id: Optional[int] = None
    requested_by_coordinator_id: Optional[int] = None
    requested_by_user_id: Optional[int] = None


class ResourceRequestCreate(ResourceRequestBase):
    pass


class ResourceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    resource_type: Optional[str] = None
    quantity_needed: Optional[str] = None
    priority_level: Optional[str] = None
    disaster_id: Optional[int] = None
    camp_id: Optional[int] = None
    notes: Optional[str] = None


class ResourceRequestStatusUpdate(BaseModel):
    status: RequestStatus
    approved_by: Optional[int] = None
    notes: Optional[str] = None


class ResourceRequestResponse(ResourceRequestBase):
    request_id: int
    status: RequestStatus
    approved_by: Optional[int] = None
    request_date: datetime
    approved_date: Optional[datetime] = None
    fulfilled_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Volunteer Assignment Schemas
class VolunteerAssignmentBase(BaseModel):
    volunteer_id: int
    disaster_id: int
    camp_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    role: Optional[str] = None
    notes: Optional[str] = None


class VolunteerAssignmentCreate(VolunteerAssignmentBase):
    pass  # assigned_by will be set from authenticated admin user


class VolunteerAssignmentUpdate(BaseModel):
    camp_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    role: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class VolunteerAssignment(VolunteerAssignmentBase):
    assignment_id: int
    assigned_by: int
    assignment_date: datetime
    status: Optional[str] = "Active"
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


# Response Models with Relations
class DisasterWithRelations(Disaster):
    camps: List[Camp] = []
    donations: List[Donation] = []
    resource_requests: List[ResourceRequestResponse] = []
    created_by_user: Optional[User] = None


class CampWithRelations(Camp):
    disaster: Optional[Disaster] = None
    resource_requests: List[ResourceRequestResponse] = []
    volunteer_assignments: List[VolunteerAssignment] = []
    coordinators: List[CampCoordinator] = []
    created_by_user: Optional[User] = None


class VolunteerWithAssignments(Volunteer):
    volunteer_assignments: List[VolunteerAssignment] = []


class UserWithCreations(User):
    created_disasters: List[Disaster] = []
    created_camps: List[Camp] = []
    managed_assignments: List[VolunteerAssignment] = []
    coordinated_camps: List[CampCoordinator] = []


# Statistics Schemas
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


# Admin-specific schemas
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