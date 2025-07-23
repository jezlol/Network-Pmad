from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import get_db
from ..services.device_service import DeviceService
from ..models.device import Device
from ..auth.middleware import require_viewer_or_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Devices"])

@router.get("/devices", response_model=List[dict])
async def get_devices(db: Session = Depends(get_db), current_user: dict = Depends(require_viewer_or_admin)):
    """
    Get all discovered devices.
    
    Returns:
        List[dict]: List of all devices in the database
    """
    try:
        devices = await DeviceService.get_all_devices()
        return [
            {
                "id": str(device.id),
                "ip_address": device.ip_address,
                "mac_address": device.mac_address,
                "hostname": device.hostname,
                "status": device.status,
                "created_at": device.created_at.isoformat() if device.created_at else None,
                "updated_at": device.updated_at.isoformat() if device.updated_at else None,
            }
            for device in devices
        ]
    except Exception as e:
        logger.error(f"Failed to retrieve devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve devices"
        )

@router.get("/devices/{device_id}", response_model=dict)
async def get_device(device_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_viewer_or_admin)):
    """
    Get a specific device by ID.
    
    Args:
        device_id: The ID of the device to retrieve
        
    Returns:
        dict: Device information
    """
    try:
        from sqlalchemy.orm import Session
        session = next(get_db())
        device = session.query(Device).filter(Device.id == device_id).first()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found"
            )
        
        return {
            "id": str(device.id),
            "ip_address": device.ip_address,
            "mac_address": device.mac_address,
            "hostname": device.hostname,
            "status": device.status,
            "created_at": device.created_at.isoformat() if device.created_at else None,
            "updated_at": device.updated_at.isoformat() if device.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve device {device_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve device"
        ) 