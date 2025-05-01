import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from app.config.settings import get_settings
from app.models.user import TokenData

settings = get_settings()

# Password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate a password hash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token(user_id: str) -> str:
    """Create a refresh token with longer expiry"""
    expires = timedelta(seconds=settings.jwt_refresh_expiration)
    return create_access_token(
        {"sub": user_id, "type": "refresh"},
        expires_delta=expires
    )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Verify and decode JWT token to get current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "user")
        permissions: List[str] = payload.get("permissions", [])
        exp: int = payload.get("exp")
        
        if user_id is None:
            raise credentials_exception
            
        token_data = TokenData(
            user_id=user_id,
            role=role,
            permissions=permissions,
            exp=exp
        )
        return token_data
    except JWTError:
        raise credentials_exception 