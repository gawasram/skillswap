import time
import uuid
from typing import Callable, Dict, List, Tuple, Optional, Any
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis

from app.utils.logging import get_logger
from app.config.settings import get_settings

settings = get_settings()
logger = get_logger("middleware")

# Simple in-memory rate limiter for development
# In production, use Redis for distributed rate limiting
class InMemoryStore:
    def __init__(self):
        self.store: Dict[str, List[float]] = {}
        
    async def get_requests(self, key: str) -> List[float]:
        if key not in self.store:
            self.store[key] = []
        return self.store[key]
        
    async def add_request(self, key: str, timestamp: float):
        if key not in self.store:
            self.store[key] = []
        self.store[key].append(timestamp)
        
    async def clean_old_requests(self, key: str, window_ms: int):
        if key not in self.store:
            return
        cutoff = time.time() - (window_ms / 1000)
        self.store[key] = [t for t in self.store[key] if t > cutoff]

# Memory store for development
memory_store = InMemoryStore()

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.rate_limit_enabled:
            return await call_next(request)
            
        # Get client IP or use forwarded header in production
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for certain paths
        if request.url.path.startswith("/api/docs") or request.url.path.startswith("/api/redoc"):
            return await call_next(request)
        
        # Get request timestamp
        current_time = time.time()
        
        # Check rate limit
        await memory_store.clean_old_requests(client_ip, settings.rate_limit_window_ms)
        recent_requests = await memory_store.get_requests(client_ip)
        
        if len(recent_requests) >= settings.rate_limit_max_requests:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "message": "Too many requests, please try again later",
                    "error": "rate_limit_exceeded"
                }
            )
        
        # Add current request to store
        await memory_store.add_request(client_ip, current_time)
        
        # Process request
        return await call_next(request)

class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global error handling middleware
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        path = request.url.path
        method = request.method
        
        try:
            response = await call_next(request)
            
            # Log request details
            process_time = (time.time() - start_time) * 1000
            log = logger.info if response.status_code < 400 else logger.warning
            
            log(
                f"{method} {path} completed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "path": path,
                    "status_code": response.status_code,
                    "duration_ms": process_time
                }
            )
            
            return response
            
        except Exception as e:
            # Log the exception
            process_time = (time.time() - start_time) * 1000
            logger.error(
                f"Unhandled exception in {method} {path}: {str(e)}",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "method": method, 
                    "path": path,
                    "duration_ms": process_time
                }
            )
            
            # Return JSON error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "error": "server_error",
                    "request_id": request_id
                }
            ) 