import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.asyncio import AsyncioIntegration

from app.config.settings import get_settings

settings = get_settings()

def init_sentry():
    """
    Initialize Sentry for error tracking
    """
    if not settings.sentry_dsn:
        # Skip if no DSN is set
        return
        
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        environment=settings.environment,
        integrations=[
            FastApiIntegration(),
            StarletteIntegration(),
            AsyncioIntegration()
        ],
        release="skillswap@1.0.0",  # Use your own versioning scheme
        
        # Configure which data is captured with events
        send_default_pii=False,  # Avoid sending PII by default
        
        # Configure performance monitoring
        enable_tracing=True
    )
    
    # Set user-readable event contexts
    sentry_sdk.set_context("environment", {
        "name": settings.environment,
        "debug": settings.debug
    })
    
    # Set tags for easier filtering
    sentry_sdk.set_tag("app_name", settings.app_name)
    
    return True 