from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
import os
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/network_monitor")

# Create declarative base
Base = declarative_base()

# Lazy initialization
_engine = None
_SessionLocal = None

def _get_engine():
    """Get or create the database engine."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=False,  # Disable pre-ping to avoid transaction conflicts
            pool_recycle=3600,    # Recycle connections every hour
            echo=False  # Set to True for SQL debugging
        )
    return _engine

def _get_session_local():
    """Get or create the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_get_engine())
    return _SessionLocal

def get_db():
    """Dependency to get database session."""
    db = _get_session_local()()
    try:
        yield db
    finally:
        db.close()

def get_db_session():
    """Context manager for database sessions."""
    return _get_session_local()()

def init_db():
    """Initialize database tables."""
    try:
        # Import all models to ensure they're registered
        from .models.device import Device
        
        # Test connection first
        engine = _get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        logger.warning("API will start without database connection. Please check:")
        logger.warning("1. Database credentials are correct")
        logger.warning("2. IP address is whitelisted in Supabase")
        logger.warning("3. Network connectivity to Supabase")
        return False