import asyncio
import argparse
import sys
from typing import Dict, List, Optional, Any

from app.utils.logging import get_logger
from app.utils.migrations import MigrationManager
from app.utils.backup import DatabaseBackup
from app.config.database import connect_to_mongodb, close_mongodb_connection
from app.config.settings import get_settings

settings = get_settings()
logger = get_logger("cli")

async def run_migrations_command(args: argparse.Namespace) -> int:
    """Run database migrations"""
    try:
        # Connect to database
        await connect_to_mongodb()
        
        # Initialize migration manager
        migration_manager = MigrationManager()
        
        if args.create:
            # Create a new migration
            filepath = await migration_manager.create_migration(
                args.create, 
                args.description or f"Migration for {args.create}"
            )
            print(f"Created new migration: {filepath}")
            return 0
            
        elif args.rollback:
            # Rollback migrations
            count = args.count or 1
            print(f"Rolling back {count} migrations...")
            results = await migration_manager.rollback_migrations(count)
            
            # Print results
            print(f"Rolled back: {results['rolled_back']}/{results['total']}")
            if results['failed'] > 0:
                print(f"Failed: {results['failed']}")
                return 1
            return 0
            
        else:
            # Run migrations
            print("Running migrations...")
            results = await migration_manager.run_migrations(args.up_to)
            
            # Print results
            print(f"Applied: {results['applied']}/{results['total']}")
            if results['skipped'] > 0:
                print(f"Skipped: {results['skipped']}")
            if results['failed'] > 0:
                print(f"Failed: {results['failed']}")
                return 1
            return 0
            
    except Exception as e:
        logger.error(f"Error running migrations: {str(e)}", exc_info=True)
        print(f"Error: {str(e)}")
        return 1
        
    finally:
        # Close database connection
        await close_mongodb_connection()

async def run_backup_command(args: argparse.Namespace) -> int:
    """Run database backup operations"""
    try:
        # Connect to database
        await connect_to_mongodb()
        
        # Initialize backup manager
        backup_manager = DatabaseBackup()
        
        if args.create:
            # Create a backup
            print("Creating database backup...")
            success = await backup_manager.create_backup()
            if success:
                print("Backup created successfully.")
                return 0
            else:
                print("Failed to create backup.")
                return 1
                
        elif args.restore:
            # Restore from backup
            print(f"Restoring database from backup: {args.restore}")
            success = await backup_manager.restore_backup(args.restore)
            if success:
                print("Database restored successfully.")
                return 0
            else:
                print("Failed to restore database.")
                return 1
                
        elif args.list:
            # List available backups
            backups = await backup_manager.list_available_backups()
            
            if not backups:
                print("No backups found.")
                return 0
                
            print(f"Found {len(backups)} backups:")
            for idx, backup in enumerate(backups):
                print(f"{idx+1}. {backup['filename']} ({backup['size_mb']} MB) - {backup['created_at']}")
            return 0
            
        elif args.cleanup:
            # Cleanup old backups
            print("Cleaning up old backups...")
            removed = await backup_manager.cleanup_old_backups()
            print(f"Removed {removed} old backups.")
            return 0
            
        else:
            print("No backup command specified. Use --create, --restore, --list, or --cleanup.")
            return 1
            
    except Exception as e:
        logger.error(f"Error running backup command: {str(e)}", exc_info=True)
        print(f"Error: {str(e)}")
        return 1
        
    finally:
        # Close database connection
        await close_mongodb_connection()

def create_parser() -> argparse.ArgumentParser:
    """Create command-line argument parser"""
    parser = argparse.ArgumentParser(description="SkillSwap CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Migrations command
    migrations_parser = subparsers.add_parser("migrations", help="Database migration commands")
    migrations_group = migrations_parser.add_mutually_exclusive_group(required=True)
    migrations_group.add_argument("--run", action="store_true", help="Run pending migrations")
    migrations_group.add_argument("--create", metavar="NAME", help="Create a new migration")
    migrations_group.add_argument("--rollback", action="store_true", help="Rollback migrations")
    migrations_parser.add_argument("--description", help="Migration description (for --create)")
    migrations_parser.add_argument("--up-to", help="Run migrations up to this one (for --run)")
    migrations_parser.add_argument("--count", type=int, help="Number of migrations to rollback (for --rollback)")
    
    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Database backup commands")
    backup_group = backup_parser.add_mutually_exclusive_group(required=True)
    backup_group.add_argument("--create", action="store_true", help="Create a new backup")
    backup_group.add_argument("--restore", metavar="FILENAME", help="Restore from backup")
    backup_group.add_argument("--list", action="store_true", help="List available backups")
    backup_group.add_argument("--cleanup", action="store_true", help="Clean up old backups")
    
    return parser

def main():
    """CLI entry point"""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Run the appropriate command
    if args.command == "migrations":
        exit_code = asyncio.run(run_migrations_command(args))
    elif args.command == "backup":
        exit_code = asyncio.run(run_backup_command(args))
    else:
        print(f"Unknown command: {args.command}")
        exit_code = 1
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main() 