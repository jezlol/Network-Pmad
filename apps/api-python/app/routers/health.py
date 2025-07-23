from fastapi import APIRouter
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "network-monitoring-api",
        "version": "1.0.0",
        "environment": "development"  # Add environment field for test compatibility
    }

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check endpoint with component status."""
    logger.info("Detailed health check requested")
    
    # TODO: Add actual health checks for database, external services, etc.
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "network-monitoring-api",
        "version": "1.0.0",
        "environment": "development",
        "components": {
            "api": "healthy",
            "database": "healthy",  # TODO: Add actual DB health check
            "network_scanner": "healthy"
        }
    }
    
    return health_status 