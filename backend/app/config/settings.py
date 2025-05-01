import os
from functools import lru_cache
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # App settings
    app_name: str = "SkillSwap API"
    debug: bool = Field(default=False, alias="DEBUG")
    environment: str = Field(default="development", alias="NODE_ENV")
    
    # Server settings
    port: int = Field(default=5005, alias="PORT")
    
    # MongoDB settings
    mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_db_name: str = Field(default="skillswap", alias="MONGODB_DB_NAME")
    
    # JWT Authentication
    jwt_secret: str = Field(default="jwt_super_secret_key_for_development_only", alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600  # 1 hour in seconds
    jwt_refresh_expiration: int = 604800  # 7 days in seconds
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",  # React frontend
        "http://localhost:5005",  # API itself (for testing)
    ]
    
    # Logging settings
    log_level: str = Field(default="info", alias="LOG_LEVEL")
    log_file_path: str = Field(default="logs/app.log", alias="LOG_FILE_PATH")
    
    # Error tracking with Sentry
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    sentry_traces_sample_rate: float = Field(default=1.0, alias="SENTRY_TRACES_SAMPLE_RATE")
    
    # Database backups
    backup_enabled: bool = Field(default=True, alias="BACKUP_ENABLED")
    backup_cron_schedule: str = Field(default="0 0 * * *", alias="BACKUP_CRON_SCHEDULE")  # Daily at midnight
    backup_retention_days: int = Field(default=7, alias="BACKUP_RETENTION_DAYS")
    backup_storage_path: str = Field(default="backups", alias="BACKUP_STORAGE_PATH")
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, alias="RATE_LIMIT_ENABLED")
    rate_limit_window_ms: int = Field(default=900000, alias="RATE_LIMIT_WINDOW_MS")  # 15 minutes
    rate_limit_max_requests: int = Field(default=100, alias="RATE_LIMIT_MAX_REQUESTS")
    
    # Security
    encryption_key: Optional[str] = Field(default=None, alias="ENCRYPTION_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings to avoid reading .env file on every request"""
    return Settings() 