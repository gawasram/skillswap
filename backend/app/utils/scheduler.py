import asyncio
import aiocron
from datetime import datetime
from typing import Dict, Any, Callable, Awaitable, Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.utils.logging import get_logger
from app.utils.backup import DatabaseBackup
from app.config.settings import get_settings

settings = get_settings()
logger = get_logger("scheduler")

# Global scheduler instance
_scheduler = None

def get_scheduler() -> AsyncIOScheduler:
    """Get the scheduler instance"""
    global _scheduler
    
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        
    return _scheduler

async def scheduled_backup() -> None:
    """Run scheduled database backup"""
    logger.info("Starting scheduled database backup")
    backup = DatabaseBackup()
    
    # Create new backup
    success = await backup.create_backup()
    if success:
        logger.info("Scheduled backup completed successfully")
    else:
        logger.error("Scheduled backup failed")
    
    # Clean up old backups
    removed = await backup.cleanup_old_backups()
    logger.info(f"Removed {removed} old backups")

async def scheduled_health_check() -> Dict[str, Any]:
    """Run health checks on various system components"""
    logger.info("Running scheduled health check")
    
    from app.config.database import check_db_connection, get_connection_stats
    
    # Check database connection
    db_connection = await check_db_connection()
    db_stats = get_connection_stats()
    
    # Memory usage (basic implementation)
    memory_usage = "N/A"  # Would require psutil or similar
    
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "connection": db_connection,
            "stats": db_stats
        },
        "memory_usage": memory_usage,
        "environment": settings.environment
    }
    
    logger.info(f"Health check results: Database connection: {db_connection}")
    return results

def setup_scheduler():
    """Set up scheduled tasks"""
    scheduler = get_scheduler()
    
    # Add database backup job (using schedule from settings)
    scheduler.add_job(
        scheduled_backup,
        CronTrigger.from_crontab(settings.backup_cron_schedule),
        id="database_backup",
        replace_existing=True
    )
    
    # Add health check job (every 15 minutes)
    scheduler.add_job(
        scheduled_health_check,
        "interval",
        minutes=15,
        id="health_check",
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    logger.info("Scheduler started with jobs: database_backup, health_check")
    
def shutdown_scheduler():
    """Shutdown the scheduler"""
    global _scheduler
    
    if _scheduler and _scheduler.running:
        _scheduler.shutdown()
        logger.info("Scheduler shutdown")
        _scheduler = None

# Alternative using aiocron for simpler cases
@aiocron.crontab(settings.backup_cron_schedule)
async def cron_backup():
    """Cron job for database backup using aiocron"""
    await scheduled_backup()

@aiocron.crontab('*/15 * * * *')  # Every 15 minutes
async def cron_health_check():
    """Cron job for health check using aiocron"""
    await scheduled_health_check() 