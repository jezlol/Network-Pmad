from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.models.user import User, UserRole
from app.config import settings
import uuid

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = settings.jwt_secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.jwt_access_token_expire_minutes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token has expired
        exp = payload.get("exp")
        if exp is None:
            return None
        
        # Convert exp to datetime for comparison
        exp_datetime = datetime.fromtimestamp(exp, tz=datetime.utcnow().tzinfo)
        if datetime.utcnow() > exp_datetime:
            return None
            
        return payload
    except JWTError:
        return None


def authenticate_user(username: str, password: str, db) -> Optional[User]:
    """Authenticate a user with username and password."""
    from sqlalchemy.orm import Session
    
    if isinstance(db, Session):
        user = db.query(User).filter(User.username == username).first()
    else:
        # Handle async session if needed
        user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_user_token(user: User) -> str:
    """Create a JWT token for a user."""
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role.value,
        "type": "access"
    }
    return create_access_token(token_data)


def get_user_from_token(token: str, db) -> Optional[User]:
    """Get a user from a JWT token."""
    payload = verify_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        return None
    
    from sqlalchemy.orm import Session
    if isinstance(db, Session):
        user = db.query(User).filter(User.id == user_uuid).first()
    else:
        user = db.query(User).filter(User.id == user_uuid).first()
    
    return user 