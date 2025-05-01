import os
import shutil
import time
import glob
import asyncio
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

from app.utils.logging import get_logger
from app.config.settings import get_settings

settings = get_settings()
logger = get_logger("database.backup")

class DatabaseBackup:
    """Handle MongoDB database backup operations"""
    
    def __init__(self):
        self.backup_dir = Path(settings.backup_storage_path)
        self.db_name = settings.mongodb_db_name
        self.mongodb_uri = settings.mongodb_uri
        self.retention_days = settings.backup_retention_days
        
        # Create backup directory if it doesn't exist
        self.backup_dir.mkdir(exist_ok=True, parents=True)
    
    async def create_backup(self) -> bool:
        """Create a database backup using mongodump"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = self.backup_dir / f"backup_{self.db_name}_{timestamp}"
            
            # Ensure the directory exists
            backup_path.mkdir(exist_ok=True)
            
            # Build mongodump command
            cmd = [
                "mongodump",
                f"--uri={self.mongodb_uri}",
                f"--db={self.db_name}",
                f"--out={backup_path}"
            ]
            
            # Execute mongodump
            logger.info(f"Starting backup of {self.db_name} database")
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                # Compress the backup
                archive_name = f"{backup_path}.tar.gz"
                shutil.make_archive(
                    str(backup_path),
                    'gztar',
                    root_dir=str(self.backup_dir),
                    base_dir=backup_path.name
                )
                
                # Remove the uncompressed directory
                shutil.rmtree(backup_path)
                
                logger.info(f"Successfully created backup: {archive_name}")
                return True
            else:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Backup failed: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error creating backup: {str(e)}", exc_info=True)
            return False
    
    async def restore_backup(self, backup_file: str) -> bool:
        """Restore a database from backup"""
        try:
            # Verify the backup file exists
            backup_path = self.backup_dir / backup_file
            if not backup_path.exists():
                logger.error(f"Backup file not found: {backup_file}")
                return False
            
            # Extract the backup if it's compressed
            if backup_file.endswith('.tar.gz'):
                extract_path = self.backup_dir / f"restore_temp_{int(time.time())}"
                extract_path.mkdir(exist_ok=True)
                
                shutil.unpack_archive(
                    str(backup_path),
                    extract_dir=str(extract_path)
                )
                
                # Find the extracted directory
                extracted_dirs = [d for d in extract_path.iterdir() if d.is_dir()]
                if not extracted_dirs:
                    logger.error("No valid backup found in archive")
                    return False
                
                restore_path = extracted_dirs[0]
            else:
                restore_path = backup_path
            
            # Build mongorestore command
            cmd = [
                "mongorestore",
                f"--uri={self.mongodb_uri}",
                "--drop",  # Drop existing collections before restoring
                str(restore_path)
            ]
            
            # Execute mongorestore
            logger.info(f"Starting restore of {self.db_name} database from {backup_file}")
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            # Clean up extracted files if needed
            if backup_file.endswith('.tar.gz'):
                shutil.rmtree(extract_path)
            
            if process.returncode == 0:
                logger.info(f"Successfully restored database from {backup_file}")
                return True
            else:
                error_msg = stderr.decode() if stderr else "Unknown error"
                logger.error(f"Restore failed: {error_msg}")
                return False
                
        except Exception as e:
            logger.error(f"Error restoring backup: {str(e)}", exc_info=True)
            return False
    
    async def cleanup_old_backups(self) -> int:
        """Delete backups older than retention period"""
        try:
            # Calculate cutoff date
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            removed_count = 0
            
            # Find all backup files
            backup_files = list(self.backup_dir.glob("backup_*.tar.gz"))
            
            for backup_file in backup_files:
                try:
                    # Extract date from filename (format: backup_dbname_YYYYMMDD_HHMMSS.tar.gz)
                    date_str = backup_file.stem.split('_')[2:4]
                    if len(date_str) >= 2:
                        date_str = '_'.join(date_str)
                        backup_date = datetime.strptime(date_str, "%Y%m%d_%H%M%S")
                        
                        # Check if backup is older than retention period
                        if backup_date < cutoff_date:
                            backup_file.unlink()
                            removed_count += 1
                            logger.info(f"Removed old backup: {backup_file.name}")
                except (ValueError, IndexError):
                    # Skip files that don't match expected naming pattern
                    logger.warning(f"Could not parse date from backup filename: {backup_file.name}")
                    continue
            
            logger.info(f"Cleanup complete. Removed {removed_count} old backups.")
            return removed_count
            
        except Exception as e:
            logger.error(f"Error cleaning up old backups: {str(e)}", exc_info=True)
            return 0
    
    async def list_available_backups(self):
        """List all available backups sorted by date (newest first)"""
        try:
            backup_files = list(self.backup_dir.glob("backup_*.tar.gz"))
            
            # Sort backups by creation time (newest first)
            backup_files.sort(key=lambda x: x.stat().st_ctime, reverse=True)
            
            # Create backup info list
            backups = []
            for backup_file in backup_files:
                size_mb = backup_file.stat().st_size / (1024 * 1024)
                created = datetime.fromtimestamp(backup_file.stat().st_ctime)
                
                backups.append({
                    "filename": backup_file.name,
                    "size_mb": round(size_mb, 2),
                    "created_at": created.isoformat(),
                    "age_days": (datetime.now() - created).days
                })
            
            return backups
            
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}", exc_info=True)
            return [] 