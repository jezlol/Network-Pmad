from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime, timezone

from app.routers import health, discovery, auth, devices
from app.database import init_db, get_db
from app.exceptions import NetworkMonitoringException, DatabaseConnectionError
from app.routers.auth import create_default_admin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Network Monitoring API...")
    try:
        # Initialize database
        db_connected = init_db()
        
        if db_connected:
            logger.info("Database initialized successfully")
            
            # Create default admin user
            try:
                db = next(get_db())
                create_default_admin(db)
                db.close()
                logger.info("Default admin user check completed")
            except Exception as e:
                logger.warning(f"Could not create default admin user: {e}")
        else:
            logger.warning("API starting without database connection")
            logger.warning("Some features may not work until database is connected")
        
    except Exception as e:
        logger.error(f"Failed to start API: {e}")
        # Don't raise - let the API start anyway
        logger.warning("API starting with limited functionality")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Network Monitoring API...")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Network Monitoring API",
    description="API for network device discovery and monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(discovery.router)
app.include_router(auth.router, prefix="/api")
app.include_router(devices.router)

# Global exception handlers
@app.exception_handler(NetworkMonitoringException)
async def network_monitoring_exception_handler(request, exc):
    """Handle custom network monitoring exceptions."""
    logger.error(f"Network monitoring error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "status_code": exc.status_code,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(DatabaseConnectionError)
async def database_connection_exception_handler(request, exc):
    """Handle database connection errors."""
    logger.error(f"Database connection error: {exc.message}")
    return JSONResponse(
        status_code=503,
        content={
            "error": {
                "message": exc.message,
                "status_code": 503,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "Internal server error",
                "status_code": 500,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Network Monitoring API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "docs": "/docs"  # Add docs field for test compatibility
    }

# Health check endpoint is now handled by health router

# API documentation endpoints
@app.get("/docs")
async def get_docs():
    """Get API documentation."""
    return {"message": "API documentation available at /docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)