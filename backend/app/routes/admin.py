from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import Dict, List, Any, Optional
from datetime import datetime

from app.utils.auth import get_current_user
from app.models.user import TokenData
from app.utils.backup import DatabaseBackup
from app.utils.db_indexes import get_collection_stats, analyze_slow_queries
from app.utils.logging import get_logger
from app.config.database import db, check_db_connection, get_connection_stats
from app.utils.migrations import MigrationManager

logger = get_logger("admin")
router = APIRouter(prefix="/admin", tags=["Admin"])

# Admin permission check
async def check_admin_permission(token_data: TokenData = Depends(get_current_user)):
    if token_data.role != "admin":
        logger.warning(f"Unauthorized admin access attempt by user: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required"
        )
    return token_data

@router.get("/dashboard", response_model=Dict[str, Any])
async def admin_dashboard(token_data: TokenData = Depends(check_admin_permission)):
    """Admin dashboard overview"""
    # Get database statistics
    db_stats = await get_collection_stats()
    
    # Get user statistics
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"last_active": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}})
    
    # Get other statistics (customize as needed)
    total_sessions = await db.sessions.count_documents({})
    
    return {
        "success": True,
        "stats": {
            "users": {
                "total": total_users,
                "active_today": active_users
            },
            "sessions": {
                "total": total_sessions
            },
            "database": {
                "collections": len(db_stats),
                "details": db_stats
            },
            "system": {
                "environment": "production",
                "version": "1.0.0"
            }
        }
    }

@router.get("/db/stats", response_model=Dict[str, Any])
async def database_stats(token_data: TokenData = Depends(check_admin_permission)):
    """Database statistics"""
    db_stats = await get_collection_stats()
    connection_stats = get_connection_stats()
    db_connection = await check_db_connection()
    
    return {
        "success": True,
        "stats": {
            "collections": db_stats,
            "connection": {
                "status": "connected" if db_connection else "disconnected",
                "details": connection_stats
            }
        }
    }

@router.get("/db/slow-queries", response_model=Dict[str, Any])
async def slow_queries(token_data: TokenData = Depends(check_admin_permission)):
    """Analyze slow queries"""
    queries = await analyze_slow_queries()
    
    return {
        "success": True,
        "queries": queries,
        "note": "To enable query profiling, run db.setProfilingLevel(1, {slowms: 100}) in MongoDB"
    }

@router.post("/db/backup", response_model=Dict[str, Any])
async def create_backup(
    background_tasks: BackgroundTasks,
    token_data: TokenData = Depends(check_admin_permission)
):
    """Create a database backup"""
    backup = DatabaseBackup()
    
    # Run backup in background to avoid blocking request
    background_tasks.add_task(backup.create_backup)
    
    return {
        "success": True,
        "message": "Backup started in background. Check logs for status."
    }

@router.get("/db/backups", response_model=Dict[str, Any])
async def list_backups(token_data: TokenData = Depends(check_admin_permission)):
    """List available backups"""
    backup = DatabaseBackup()
    backups = await backup.list_available_backups()
    
    return {
        "success": True,
        "backups": backups
    }

@router.post("/db/restore/{backup_name}", response_model=Dict[str, Any])
async def restore_backup(
    backup_name: str,
    token_data: TokenData = Depends(check_admin_permission)
):
    """Restore database from backup"""
    backup = DatabaseBackup()
    
    success = await backup.restore_backup(backup_name)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to restore backup"
        )
    
    return {
        "success": True,
        "message": f"Successfully restored from backup: {backup_name}"
    }

@router.get("/migrations", response_model=Dict[str, Any])
async def list_migrations(token_data: TokenData = Depends(check_admin_permission)):
    """List migrations"""
    migration_manager = MigrationManager()
    
    # Get applied and available migrations
    applied = await migration_manager.get_applied_migrations()
    available = await migration_manager.get_available_migrations()
    available_names = [m.name for m in available]
    
    # Format response
    applied_list = [{
        "name": m["name"],
        "description": m.get("description", ""),
        "applied_at": m.get("applied_at", "").isoformat() if m.get("applied_at") else None
    } for m in applied]
    
    pending = [m.name for m in available if m.name not in [a["name"] for a in applied]]
    
    return {
        "success": True,
        "migrations": {
            "applied": applied_list,
            "pending": pending,
            "total_applied": len(applied),
            "total_pending": len(pending)
        }
    }

@router.post("/migrations/run", response_model=Dict[str, Any])
async def run_migrations(token_data: TokenData = Depends(check_admin_permission)):
    """Run pending migrations"""
    migration_manager = MigrationManager()
    
    # Run migrations
    results = await migration_manager.run_migrations()
    
    return {
        "success": True,
        "results": results
    }

@router.post("/migrations/rollback", response_model=Dict[str, Any])
async def rollback_migration(
    count: int = 1,
    token_data: TokenData = Depends(check_admin_permission)
):
    """Rollback migrations"""
    migration_manager = MigrationManager()
    
    # Rollback migrations
    results = await migration_manager.rollback_migrations(count)
    
    return {
        "success": True,
        "results": results
    } 