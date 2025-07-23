from sqlalchemy import Column, String, DateTime, Float, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timezone
from typing import Optional

Base = declarative_base()

class Device(Base):
    """Device model for PostgreSQL storage."""
    
    __tablename__ = "devices"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Device identification
    ip_address = Column(String(45), nullable=False, unique=True)  # Support IPv4 and IPv6
    hostname = Column(String(255), nullable=True)
    mac_address = Column(String(17), nullable=True)  # Format: XX:XX:XX:XX:XX:XX
    
    # Device status and metadata
    device_type = Column(String(50), nullable=True, default="unknown")
    status = Column(String(20), nullable=False, default="unknown")
    
    # Network metrics
    last_response_time = Column(Float, nullable=True)  # in milliseconds
    
    # Discovery information
    first_discovered = Column(DateTime(timezone=True), nullable=False, default=func.now())
    last_seen = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    # Additional metadata
    notes = Column(Text, nullable=True)
    is_monitored = Column(Boolean, nullable=False, default=True)
    
    def __repr__(self):
        return f"<Device(id={self.id}, ip={self.ip_address}, hostname={self.hostname})>"
    
    def to_dict(self) -> dict:
        """Convert device to dictionary representation."""
        return {
            "id": str(self.id),
            "ip_address": self.ip_address,
            "hostname": self.hostname,
            "mac_address": self.mac_address,
            "device_type": self.device_type,
            "status": self.status,
            "last_response_time": self.last_response_time,
            "first_discovered": self.first_discovered.isoformat() if self.first_discovered else None,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "notes": self.notes,
            "is_monitored": self.is_monitored
        }
    
    @classmethod
    def from_discovery(cls, device_info, status: str = "online"):
        """Create Device instance from discovery DeviceInfo."""
        return cls(
            ip_address=device_info.ip_address,
            hostname=device_info.hostname,
            mac_address=device_info.mac_address,
            last_response_time=device_info.response_time,
            status=status,
            last_seen=device_info.discovered_at,
            first_discovered=device_info.discovered_at
        )
    
    @staticmethod
    def get_utc_now() -> datetime:
        """Get current UTC time with timezone awareness."""
        return datetime.now(timezone.utc)