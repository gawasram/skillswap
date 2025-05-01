from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    
class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    role: str = "user"
    two_factor_enabled: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True

class UserInDB(UserBase):
    hashed_password: str
    role: str = "user"
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None
    backup_codes: List[str] = []
    failed_login_attempts: int = 0
    account_locked: bool = False
    account_locked_until: Optional[datetime] = None
    permissions: List[str] = []
    last_active: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str
    role: str
    permissions: List[str]
    exp: int 