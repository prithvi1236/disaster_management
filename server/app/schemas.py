from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


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
    pass


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
    pass


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


# Response Models
class DisasterWithRelations(Disaster):
    camps: List[Camp] = []
    donations: List[Donation] = []