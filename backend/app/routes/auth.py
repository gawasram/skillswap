from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Dict, Any

from app.config.database import db
from app.models.user import UserCreate, UserResponse, Token
from app.utils.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    user = await db.users.find_one({
        "$or": [
            {"email": user_data.email.lower()},
            {"username": user_data.username.lower()}
        ]
    })
    
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Create user document
    user_dict = user_data.dict()
    user_dict.update({
        "email": user_data.email.lower(),
        "username": user_data.username.lower(),
        "hashed_password": get_password_hash(user_data.password),
        "role": "user",
        "permissions": ["read:own", "update:own"],  # Default permissions
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    # Remove plain password
    del user_dict["password"]
    
    # Insert into database
    user_id = await db.users.insert_one(user_dict)
    
    # Generate tokens
    access_token = create_access_token(
        data={
            "sub": str(user_id.inserted_id),
            "role": user_dict["role"],
            "permissions": user_dict["permissions"]
        },
        expires_delta=timedelta(minutes=30)
    )
    refresh_token = create_refresh_token(str(user_id.inserted_id))
    
    # Create response
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {
            "user": {
                "_id": str(user_id.inserted_id),
                "email": user_dict["email"],
                "username": user_dict["username"],
                "full_name": user_dict["full_name"],
                "role": user_dict["role"]
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        }
    }

@router.post("/login", response_model=Dict[str, Any])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user with username/email and password"""
    # Find user by username or email
    user = await db.users.find_one({
        "$or": [
            {"email": form_data.username.lower()},
            {"username": form_data.username.lower()}
        ]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is locked
    if user.get("account_locked", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is locked due to too many failed login attempts"
        )
    
    # Verify password
    if not verify_password(form_data.password, user["hashed_password"]):
        # Increment failed login attempts
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"failed_login_attempts": 1}}
        )
        
        # Lock account after 5 failed attempts
        if user.get("failed_login_attempts", 0) + 1 >= 5:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"account_locked": True}}
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Reset failed login attempts and update last active
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "failed_login_attempts": 0,
                "last_active": datetime.utcnow()
            }
        }
    )
    
    # Generate tokens
    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "role": user.get("role", "user"),
            "permissions": user.get("permissions", [])
        },
        expires_delta=timedelta(minutes=30)
    )
    refresh_token = create_refresh_token(str(user["_id"]))
    
    # Check if 2FA is required
    if user.get("two_factor_enabled", False):
        return {
            "success": True,
            "require_2fa": True,
            "message": "Two-factor authentication required",
            "user_id": str(user["_id"]),
            "refresh_token": refresh_token
        }
    
    # Create response
    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "user": {
                "_id": str(user["_id"]),
                "email": user["email"],
                "username": user["username"],
                "full_name": user["full_name"],
                "role": user.get("role", "user"),
                "two_factor_enabled": user.get("two_factor_enabled", False)
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer"
            }
        }
    }

@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    """Refresh access token using refresh token"""
    # Implement token refresh logic
    return {"message": "Token refresh endpoint"} 