from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, validator
from typing import List, Optional
import os
import uuid
from app.database import get_db
from app.models.user import User, UserRole
from app.auth.jwt_handler import (
    authenticate_user, 
    create_user_token, 
    get_password_hash,
    get_user_from_token
)
from app.auth.middleware import get_current_user, require_administrator

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str
    
    @validator('username')
    def username_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip()
    
    @validator('password')
    def password_not_empty(cls, v):
        if not v:
            raise ValueError('Password cannot be empty')
        return v


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.VIEWER
    
    @validator('username')
    def username_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip()
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class ChangePasswordRequest(BaseModel):
    new_password: str
    
    @validator('new_password')
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: str


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT token."""
    try:
        # Check if database is available
        try:
            db.execute(text("SELECT 1"))
        except Exception as db_error:
            # Database not available - provide helpful error message
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection unavailable. Please check database configuration and connectivity."
            )
        
        user = authenticate_user(login_data.username, login_data.password, db)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_user_token(user)
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": str(user.id),
                "username": user.username,
                "role": user.role.value
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/users", response_model=UserResponse, dependencies=[Depends(require_administrator)])
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create a new user (admin only)."""
    try:
        # Check if username already exists
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username,
            password_hash=hashed_password,
            role=user_data.role
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return UserResponse(
            id=str(new_user.id),
            username=new_user.username,
            role=new_user.role.value,
            created_at=new_user.created_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get("/users", response_model=List[UserResponse], dependencies=[Depends(require_administrator)])
def get_users(db: Session = Depends(get_db)):
    """Get all users (admin only)."""
    try:
        users = db.query(User).all()
        return [
            UserResponse(
                id=str(user.id),
                username=user.username,
                role=user.role.value,
                created_at=user.created_at.isoformat()
            )
            for user in users
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.get("/me", response_model=dict)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.put("/users/{user_id}/password", dependencies=[Depends(require_administrator)])
def change_user_password(user_id: str, password_data: ChangePasswordRequest, db: Session = Depends(get_db)):
    """Change a user's password (admin only)."""
    try:
        # Validate UUID format
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update password
        user.password_hash = get_password_hash(password_data.new_password)
        db.commit()
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.delete("/users/{user_id}", dependencies=[Depends(require_administrator)])
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user (admin only)."""
    try:
        # Validate UUID format
        try:
            user_uuid = uuid.UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deletion of the last administrator
        if user.role == UserRole.ADMINISTRATOR:
            admin_count = db.query(User).filter(User.role == UserRole.ADMINISTRATOR).count()
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete the last administrator"
                )
        
        db.delete(user)
        db.commit()
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


# Initialize default admin user if not exists
def create_default_admin(db: Session):
    """Create a default administrator user if none exists."""
    try:
        admin_user = db.query(User).filter(User.role == UserRole.ADMINISTRATOR).first()
        
        if not admin_user:
            # Use environment variables for default credentials
            default_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
            default_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
            
            # Validate password length
            if len(default_password) < 6:
                print("Warning: Default admin password is too short. Using fallback password.")
                default_password = "admin123"
            
            hashed_password = get_password_hash(default_password)
            
            admin_user = User(
                username=default_username,
                password_hash=hashed_password,
                role=UserRole.ADMINISTRATOR
            )
            
            db.add(admin_user)
            db.commit()
            print(f"Default admin user created: username={default_username}")
            print("IMPORTANT: Change the default password in production!")
    except Exception as e:
        print(f"Failed to create default admin user: {e}")
        db.rollback()