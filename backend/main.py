import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import connect_to_mongodb, close_mongodb_connection
from app.routes import auth, users, sessions, webhooks, blockchain, admin
from app.utils.middleware import ErrorHandlerMiddleware, RateLimitMiddleware
from app.utils.sentry import init_sentry
from app.utils.scheduler import setup_scheduler, shutdown_scheduler
from app.utils.db_indexes import create_indexes
from app.config.settings import get_settings

settings = get_settings()

# Initialize Sentry if DSN is configured
init_sentry()

# Create FastAPI app
app = FastAPI(
    title="SkillSwap API",
    description="REST API for SkillSwap platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Middleware
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimitMiddleware)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event handlers for startup and shutdown
@app.on_event("startup")
async def startup_db_client():
    # Connect to MongoDB
    await connect_to_mongodb()
    
    # Create indexes
    await create_indexes()
    
    # Set up scheduler for background tasks
    if settings.environment == "production":
        setup_scheduler()

@app.on_event("shutdown")
async def shutdown_db_client():
    # Close MongoDB connection
    await close_mongodb_connection()
    
    # Shutdown scheduler
    shutdown_scheduler()

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to SkillSwap API"}

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
        "version": "1.0.0"
    }

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(webhooks.router, prefix="/api", tags=["Webhooks"])
app.include_router(blockchain.router, prefix="/api", tags=["Blockchain"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=settings.debug) 