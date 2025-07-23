import os
from pydantic_settings import BaseSettings
from typing import Optional, List
import secrets

class Settings(BaseSettings):
    """
    Application configuration using environment variables.
    Follows coding standard: Environment variables must be loaded into a config module.
    """
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    environment: str = "development"
    
    # Security Configuration
    secret_key: str = secrets.token_urlsafe(32)  # Generate secure default
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # JWT Configuration
    jwt_secret_key: str = secrets.token_urlsafe(32)  # Generate secure default
    jwt_access_token_expire_minutes: int = 30
    jwt_algorithm: str = "HS256"
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    allow_credentials: bool = True
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE"]
    allowed_headers: List[str] = ["*"]
    
    # Database Configuration
    database_url: Optional[str] = None
    database_pool_size: int = 5
    database_pool_overflow: int = 10
    
    # InfluxDB Configuration  
    influxdb_url: Optional[str] = None
    influxdb_token: Optional[str] = None
    influxdb_bucket: str = "network_metrics"
    influxdb_org: Optional[str] = None
    
    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # API Configuration
    api_v1_prefix: str = "/api/v1"
    docs_url: Optional[str] = "/docs" if environment == "development" else None
    redoc_url: Optional[str] = "/redoc" if environment == "development" else None
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        env_prefix = ""

# Global settings instance
settings = Settings()

# Validate critical settings
if settings.is_production and settings.secret_key == secrets.token_urlsafe(32):
    raise ValueError("SECRET_KEY must be explicitly set in production environment")

if settings.is_production and settings.debug:
    raise ValueError("DEBUG must be False in production environment")

if settings.is_production and settings.jwt_secret_key == secrets.token_urlsafe(32):
    raise ValueError("JWT_SECRET_KEY must be explicitly set in production environment") 