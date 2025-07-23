from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import logging

from ..services.network_scanner import NetworkScanner
from ..services.device_service import DeviceService
from ..database import get_db
from ..exceptions import NetworkMonitoringException, DatabaseConnectionError
from ..models.discovery import DeviceInfo, DiscoveryRequest, DiscoveryResponse
from ..auth.middleware import require_viewer_or_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Discovery"])

@router.post("/discover", response_model=DiscoveryResponse, dependencies=[Depends(require_viewer_or_admin)])
async def discover_network(request: DiscoveryRequest = DiscoveryRequest()):
    """
    Trigger a network discovery scan to find active devices.
    
    Args:
        request: Discovery configuration parameters
        
    Returns:
        DiscoveryResponse: Results of the network scan
        
    Raises:
        NetworkMonitoringException: If network scanning fails
    """
    logger.info(f"Starting network discovery scan for range: {request.network_range}")
    
    try:
        # Initialize network scanner
        scanner = NetworkScanner(
            timeout=request.timeout,
            network_range=request.network_range
        )
        
        # Perform network scan
        scan_result = await scanner.scan_network()
        
        # Save discovered devices to database
        if scan_result.devices:
            try:
                saved_devices = await DeviceService.save_discovered_devices(scan_result.devices)
                logger.info(f"Saved {len(saved_devices)} devices to database")
            except Exception as e:
                logger.error(f"Failed to save devices to database: {e}")
                # Continue with response even if database save fails
        
        logger.info(f"Discovery scan completed. Found {len(scan_result.devices)} devices")
        
        return scan_result
        
    except NetworkMonitoringException as e:
        logger.error(f"Network discovery failed: {e.message}")
        raise  # Re-raise the custom exception for our handler
    except Exception as e:
        logger.error(f"Unexpected error during network discovery: {str(e)}")
        raise NetworkMonitoringException("Network discovery failed", 500)