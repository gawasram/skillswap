import os
import json
import logging
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from app.config.settings import get_settings

settings = get_settings()

# Create logs directory if it doesn't exist
Path("logs").mkdir(exist_ok=True)

# Configure logger
class JSONFormatter(logging.Formatter):
    """
    Formatter that outputs JSON strings after parsing the log record.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "environment": settings.environment,
        }
        
        # Add exception info if available
        if record.exc_info:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }
            
        # Add extra fields
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
            
        if hasattr(record, "user_id"):
            log_record["user_id"] = record.user_id
            
        if hasattr(record, "duration_ms"):
            log_record["duration_ms"] = record.duration_ms
            
        if hasattr(record, "path"):
            log_record["path"] = record.path
            
        if hasattr(record, "method"):
            log_record["method"] = record.method
            
        if hasattr(record, "status_code"):
            log_record["status_code"] = record.status_code
        
        return json.dumps(log_record)

def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set log level based on settings
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Add console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # Add file handler
    if settings.log_file_path:
        file_handler = logging.FileHandler(settings.log_file_path)
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
    
    return logger 