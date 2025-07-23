from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging
from datetime import datetime, timezone

from ..models.device import Device
from ..models.discovery import DeviceInfo
from ..database import get_db_session
from ..exceptions import DatabaseConnectionError, ValidationError

logger = logging.getLogger(__name__)

class DeviceService:
    """Service for managing device data in the database."""
    
    @staticmethod
    def _get_utc_now() -> datetime:
        """Get current UTC time with timezone awareness."""
        return datetime.now(timezone.utc)
    
    # Async methods for API use
    @staticmethod
    async def save_discovered_devices(devices: List[DeviceInfo]) -> List[Device]:
        """Save discovered devices to the database."""
        saved_devices = []
        
        try:
            with get_db_session() as session:
                for device_info in devices:
                    try:
                        # Check if device already exists
                        existing_device = session.query(Device).filter(
                            Device.ip_address == device_info.ip_address
                        ).first()
                        
                        if existing_device:
                            # Update existing device
                            updated_device = DeviceService._update_existing_device(
                                session, existing_device, device_info
                            )
                            saved_devices.append(updated_device)
                        else:
                            # Create new device
                            new_device = DeviceService._create_new_device(
                                session, device_info
                            )
                            saved_devices.append(new_device)
                            
                    except Exception as e:
                        logger.error(f"Failed to save device {device_info.ip_address}: {e}")
                        continue
                
                # Commit all changes
                session.commit()
                
        except Exception as e:
            logger.error(f"Failed to save discovered devices: {e}")
            raise DatabaseConnectionError(f"Device save operation failed: {str(e)}")
        
        logger.info(f"Successfully saved {len(saved_devices)} devices to database")
        return saved_devices
    
    @staticmethod
    async def get_all_devices() -> List[Device]:
        """Get all devices from the database."""
        try:
            with get_db_session() as session:
                devices = session.query(Device).order_by(Device.ip_address).all()
                return devices
        except Exception as e:
            logger.error(f"Failed to retrieve devices: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    async def get_device_by_ip(ip_address: str) -> Optional[Device]:
        """Get a device by IP address."""
        try:
            with get_db_session() as session:
                device = session.query(Device).filter(
                    Device.ip_address == ip_address
                ).first()
                return device
        except Exception as e:
            logger.error(f"Failed to retrieve device {ip_address}: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    async def get_device_by_id(device_id: str) -> Optional[Device]:
        """Get a device by ID."""
        try:
            with get_db_session() as session:
                device = session.query(Device).filter(
                    Device.id == device_id
                ).first()
                return device
        except Exception as e:
            logger.error(f"Failed to retrieve device {device_id}: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    async def mark_devices_offline(exclude_ips: List[str] = None) -> int:
        """Mark devices as offline if they weren't seen in recent scan."""
        exclude_ips = exclude_ips or []
        
        try:
            with get_db_session() as session:
                query = session.query(Device).filter(
                    Device.status != "offline"
                )
                
                if exclude_ips:
                    query = query.filter(~Device.ip_address.in_(exclude_ips))
                
                updated_count = query.update({
                    Device.status: "offline",
                    Device.updated_at: DeviceService._get_utc_now()
                })
                
                session.commit()
                
                logger.info(f"Marked {updated_count} devices as offline")
                return updated_count
                
        except Exception as e:
            logger.error(f"Failed to mark devices offline: {e}")
            raise DatabaseConnectionError(f"Device status update failed: {str(e)}")
    
    @staticmethod
    async def delete_device(device_id: str) -> bool:
        """Delete a device from the database."""
        try:
            with get_db_session() as session:
                device = session.query(Device).filter(
                    Device.id == device_id
                ).first()
                
                if not device:
                    return False
                
                session.delete(device)
                session.commit()
                
                logger.info(f"Deleted device: {device.ip_address} ({device_id})")
                return True
                
        except Exception as e:
            logger.error(f"Failed to delete device {device_id}: {e}")
            raise DatabaseConnectionError(f"Device deletion failed: {str(e)}")
    
    # Synchronous methods for testing
    @staticmethod
    def save_discovered_device(session: Session, device_info: DeviceInfo) -> Device:
        """Save a single discovered device to the database (for testing)."""
        try:
            # Check if device already exists
            existing_device = session.query(Device).filter(
                Device.ip_address == device_info.ip_address
            ).first()
            
            if existing_device:
                # Update existing device
                return DeviceService._update_existing_device(session, existing_device, device_info)
            else:
                # Create new device
                device = DeviceService._create_new_device(session, device_info)
                session.flush()  # This will trigger the error in the test
                return device
                
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to save device {device_info.ip_address}: {e}")
            raise DatabaseConnectionError(f"Device save operation failed: {str(e)}")
    
    @staticmethod
    def get_all_devices_sync(session: Session) -> List[Device]:
        """Get all devices from the database (for testing)."""
        try:
            devices = session.query(Device).order_by(Device.ip_address).all()
            return devices
        except Exception as e:
            logger.error(f"Failed to retrieve devices: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    def get_device_by_ip_sync(session: Session, ip_address: str) -> Optional[Device]:
        """Get a device by IP address (for testing)."""
        try:
            device = session.query(Device).filter(
                Device.ip_address == ip_address
            ).first()
            return device
        except Exception as e:
            logger.error(f"Failed to retrieve device {ip_address}: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    def get_device_by_id_sync(session: Session, device_id: str) -> Optional[Device]:
        """Get a device by ID (for testing)."""
        try:
            device = session.query(Device).filter(
                Device.id == device_id
            ).first()
            return device
        except Exception as e:
            logger.error(f"Failed to retrieve device {device_id}: {e}")
            raise DatabaseConnectionError(f"Device retrieval failed: {str(e)}")
    
    @staticmethod
    def mark_device_offline(session: Session, ip_address: str) -> Optional[Device]:
        """Mark a single device as offline (for testing)."""
        try:
            device = session.query(Device).filter(
                Device.ip_address == ip_address
            ).first()
            
            if device:
                device.status = "offline"
                device.last_response_time = None  # Clear response time when marking offline
                device.updated_at = DeviceService._get_utc_now()
                session.commit()
                logger.info(f"Marked device {ip_address} as offline")
                return device
            
            return None
            
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to mark device {ip_address} offline: {e}")
            raise DatabaseConnectionError(f"Device status update failed: {str(e)}")
    
    @staticmethod
    def delete_device_sync(session: Session, device_id: str) -> bool:
        """Delete a device from the database (for testing)."""
        try:
            device = session.query(Device).filter(
                Device.id == device_id
            ).first()
            
            if not device:
                return False
            
            session.delete(device)
            session.commit()
            
            logger.info(f"Deleted device: {device.ip_address} ({device_id})")
            return True
            
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to delete device {device_id}: {e}")
            raise DatabaseConnectionError(f"Device deletion failed: {str(e)}")
    
    # Private helper methods
    @staticmethod
    def _create_new_device(session: Session, device_info: DeviceInfo) -> Device:
        """Create a new device from discovery info."""
        device = Device.from_discovery(device_info, status="online")
        session.add(device)
        return device
    
    @staticmethod
    def _update_existing_device(session: Session, existing_device: Device, device_info: DeviceInfo) -> Device:
        """Update an existing device with new discovery info."""
        existing_device.hostname = device_info.hostname
        existing_device.mac_address = device_info.mac_address
        existing_device.last_response_time = device_info.response_time
        existing_device.status = "online"
        existing_device.last_seen = device_info.discovered_at
        existing_device.updated_at = DeviceService._get_utc_now()
        return existing_device