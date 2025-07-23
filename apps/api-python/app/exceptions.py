import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
from typing import Union

logger = logging.getLogger(__name__)

class NetworkMonitoringException(Exception):
    """Base exception for all network monitoring related errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class DatabaseConnectionError(NetworkMonitoringException):
    """Raised when database connection fails."""
    def __init__(self, message: str = "Database connection failed"):
        super().__init__(message, 503)

class ValidationError(NetworkMonitoringException):
    """Raised when data validation fails."""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, 422)

async def network_monitoring_exception_handler(request: Request, exc: NetworkMonitoringException):
    """Handle custom network monitoring exceptions."""
    logger.error(f"NetworkMonitoringException: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "type": exc.__class__.__name__,
                "status_code": exc.status_code
            }
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI validation errors."""
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "message": "Request validation failed",
                "type": "ValidationError",
                "status_code": 422,
                "details": exc.errors()
            }
        }
    )

async def http_exception_handler(request: Request, exc: Union[HTTPException, StarletteHTTPException]):
    """Handle HTTP exceptions."""
    logger.warning(f"HTTP exception: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "type": "HTTPException",
                "status_code": exc.status_code
            }
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "message": "Internal server error",
                "type": "InternalServerError",
                "status_code": 500
            }
        }
    )

def setup_exception_handlers(app):
    """Set up all exception handlers for the FastAPI app."""
    app.add_exception_handler(NetworkMonitoringException, network_monitoring_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler) 