from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    camps = relationship("Camp", back_populates="disaster")
    donations = relationship("Donation", back_populates="disaster")


class Camp(Base):
    __tablename__ = "camps"

    camp_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    occupancy = Column(Integer, default=0)
    contact_info = Column(String(255), nullable=True)
    facilities = Column(Text, nullable=True)
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    disaster = relationship("Disaster", back_populates="camps")


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
    status = Column(String(50), default="Active")
    disaster_id = Column(Integer, ForeignKey("disasters.disaster_id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())