from fastapi import APIRouter, Depends, HTTPException, status, Path
from typing import Dict, Any, List
from bson import ObjectId

from app.config.database import db
from app.models.user import UserResponse
from app.utils.auth import get_current_user, TokenData

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=Dict[str, Any])
async def get_all_users(current_user: TokenData = Depends(get_current_user)):
    """
    Get all users (admin only)
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
    
    # Get all users from database
    users = await db.users.find().to_list(1000)
    
    # Transform results
    users = [{
        "_id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user.get("role", "user"),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"]
    } for user in users]
    
    return {
        "success": True,
        "message": "Users retrieved successfully",
        "data": users
    }

@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user(
    user_id: str = Path(...),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Get user by ID (own user or admin)
    """
    # Check if user is requesting own profile or is admin
    if current_user.user_id != user_id and current_user.role != "admin":
        # Check permissions
        if "read:any" not in current_user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
    
    # Get user from database
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Transform result
    user_data = {
        "_id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user.get("role", "user"),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"]
    }
    
    return {
        "success": True,
        "message": "User retrieved successfully",
        "data": user_data
    }

@router.put("/{user_id}", response_model=Dict[str, Any])
async def update_user(
    user_id: str = Path(...),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Update user by ID (own user or admin)
    """
    # Implement user update logic
    return {"message": f"Update user with ID: {user_id}"}

@router.delete("/{user_id}", response_model=Dict[str, Any])
async def delete_user(
    user_id: str = Path(...),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Delete user by ID (admin only)
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )
    
    # Implement user deletion logic
    return {"message": f"Delete user with ID: {user_id}"} 