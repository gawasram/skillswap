import os
from functools import lru_cache
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Manually get environment variables with fallbacks
    app_name: str = "SkillSwap API"
    debug: bool = Field(default_factory=lambda: os.environ.get("DEBUG", "false").lower() in ('true', '1', 't', 'yes'))
    environment: str = Field(default_factory=lambda: os.environ.get("NODE_ENV", "development"))
    
    # Server settings
    port: int = Field(default_factory=lambda: int(os.environ.get("PORT", "5005")))
    
    # MongoDB settings
    mongodb_uri: str = Field(default_factory=lambda: os.environ.get("MONGODB_URI", "mongodb://localhost:27017"))
    mongodb_db_name: str = Field(default_factory=lambda: os.environ.get("MONGODB_DB_NAME", "skillswap"))
    
    # JWT Authentication
    jwt_secret: str = Field(default_factory=lambda: os.environ.get("JWT_SECRET", "jwt_super_secret_key_for_development_only"))
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600  # 1 hour in seconds
    jwt_refresh_expiration: int = 604800  # 7 days in seconds
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:5005",  # API itself (for testing)
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings to avoid reading .env file on every request"""
    return Settings() 