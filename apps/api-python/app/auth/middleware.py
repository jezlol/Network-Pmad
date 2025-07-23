from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt_handler import get_user_from_token
from app.models.user import UserRole
from typing import Optional

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """Get the current authenticated user from JWT token."""
    token = credentials.credentials
    user = get_user_from_token(token, db)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": str(user.id),
        "username": user.username,
        "role": user.role.value
    }


def require_administrator(current_user: dict = Depends(get_current_user)) -> dict:
    """Require administrator role for access."""
    if current_user["role"] != UserRole.ADMINISTRATOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user


def require_viewer_or_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require viewer or administrator role for access."""
    if current_user["role"] not in [UserRole.VIEWER.value, UserRole.ADMINISTRATOR.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """Get the current user if authenticated, otherwise return None."""
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        user = get_user_from_token(token, db)
        
        if user is None:
            return None
        
        return {
            "id": str(user.id),
            "username": user.username,
            "role": user.role.value
        }
    except Exception:
        return None 