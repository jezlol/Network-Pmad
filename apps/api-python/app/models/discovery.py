from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DeviceInfo(BaseModel):
    """Information about a discovered network device."""
    ip_address: str = Field(..., description="IP address of the device")
    hostname: Optional[str] = Field(None, description="Hostname of the device")
    mac_address: Optional[str] = Field(None, description="MAC address of the device")
    response_time: Optional[float] = Field(None, description="Response time in milliseconds")
    discovered_at: datetime = Field(..., description="When the device was discovered")


class DiscoveryRequest(BaseModel):
    """Request model for network discovery."""
    network_range: Optional[str] = Field(None, description="Network range to scan (e.g., '192.168.1.0/24')")
    timeout: Optional[int] = Field(5, ge=1, le=30, description="Timeout in seconds for each host")


class DiscoveryResponse(BaseModel):
    """Response model for network discovery."""
    scan_id: str = Field(..., description="Unique identifier for this scan")
    network_range: str = Field(..., description="Network range that was scanned")
    devices_found: int = Field(..., description="Number of devices found")
    devices: List[DeviceInfo] = Field(..., description="List of discovered devices")
    scan_duration: float = Field(..., description="Duration of the scan in seconds")
    started_at: datetime = Field(..., description="When the scan started")
    completed_at: datetime = Field(..., description="When the scan completed")