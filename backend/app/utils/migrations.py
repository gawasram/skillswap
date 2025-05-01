import os
import glob
import importlib.util
import inspect
from datetime import datetime
from typing import List, Dict, Any, Callable, Awaitable

from app.utils.logging import get_logger
from app.config.database import db
from app.config.settings import get_settings

settings = get_settings()
logger = get_logger("database.migrations")

class Migration:
    """Base class for database migrations"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.created_at = datetime.utcnow()
    
    async def up(self) -> bool:
        """Apply the migration"""
        raise NotImplementedError("Migration must implement 'up' method")
    
    async def down(self) -> bool:
        """Rollback the migration"""
        raise NotImplementedError("Migration must implement 'down' method")

class MigrationManager:
    """Manage database migrations"""
    
    def __init__(self):
        self.migrations_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations")
        self.migrations_collection = "migrations"
    
    async def initialize(self):
        """Set up migrations tracking collection"""
        # Create migrations collection if it doesn't exist
        collections = await db.list_collection_names()
        if self.migrations_collection not in collections:
            await db.create_collection(self.migrations_collection)
            
            # Create index on name for faster lookups
            await db[self.migrations_collection].create_index("name", unique=True)
    
    async def get_applied_migrations(self) -> List[Dict[str, Any]]:
        """Get list of already applied migrations"""
        return await db[self.migrations_collection].find().sort("applied_at", 1).to_list(length=1000)
    
    async def get_available_migrations(self) -> List[Migration]:
        """Get list of available migration files"""
        migrations = []
        
        # Create migrations directory if it doesn't exist
        os.makedirs(self.migrations_dir, exist_ok=True)
        
        # Get all .py files in migrations directory
        migration_files = glob.glob(os.path.join(self.migrations_dir, "*.py"))
        
        for file_path in sorted(migration_files):
            # Skip __init__.py and non-migration files
            filename = os.path.basename(file_path)
            if filename == "__init__.py" or not filename.startswith("migration_"):
                continue
            
            # Load the module
            try:
                module_name = filename.replace(".py", "")
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    # Find the Migration class in the module
                    for attr_name in dir(module):
                        attr = getattr(module, attr_name)
                        if (inspect.isclass(attr) and 
                            issubclass(attr, Migration) and 
                            attr is not Migration):
                            # Create an instance of the migration
                            migration = attr()
                            migrations.append(migration)
                            break
            except Exception as e:
                logger.error(f"Error loading migration {filename}: {str(e)}", exc_info=True)
        
        # Sort migrations by name (which should include timestamp)
        return sorted(migrations, key=lambda m: m.name)
    
    async def create_migration(self, name: str, description: str) -> str:
        """Create a new migration file"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        migration_name = f"migration_{timestamp}_{name}"
        filename = f"{migration_name}.py"
        filepath = os.path.join(self.migrations_dir, filename)
        
        # Create migrations directory if it doesn't exist
        os.makedirs(self.migrations_dir, exist_ok=True)
        
        # Create migration file from template
        with open(filepath, "w") as f:
            f.write(f'''from app.utils.migrations import Migration

class {name.title().replace("_", "")}Migration(Migration):
    """
    {description}
    """
    
    def __init__(self):
        super().__init__("{migration_name}", "{description}")
    
    async def up(self) -> bool:
        """Apply the migration"""
        # TODO: Implement migration logic
        return True
    
    async def down(self) -> bool:
        """Rollback the migration"""
        # TODO: Implement rollback logic
        return True
''')
        
        return filepath
    
    async def apply_migration(self, migration: Migration) -> bool:
        """Apply a single migration"""
        try:
            # Check if migration was already applied
            existing = await db[self.migrations_collection].find_one({"name": migration.name})
            if existing:
                logger.warning(f"Migration {migration.name} was already applied")
                return False
            
            # Apply the migration
            logger.info(f"Applying migration: {migration.name} - {migration.description}")
            success = await migration.up()
            
            if success:
                # Record the migration
                await db[self.migrations_collection].insert_one({
                    "name": migration.name,
                    "description": migration.description,
                    "applied_at": datetime.utcnow()
                })
                logger.info(f"Migration {migration.name} applied successfully")
                return True
            else:
                logger.error(f"Migration {migration.name} failed")
                return False
                
        except Exception as e:
            logger.error(f"Error applying migration {migration.name}: {str(e)}", exc_info=True)
            return False
    
    async def rollback_migration(self, migration_name: str) -> bool:
        """Roll back a single migration by name"""
        try:
            # Check if migration exists in the database
            existing = await db[self.migrations_collection].find_one({"name": migration_name})
            if not existing:
                logger.warning(f"Migration {migration_name} was not found or not applied")
                return False
            
            # Find the migration instance
            available_migrations = await self.get_available_migrations()
            migration = next((m for m in available_migrations if m.name == migration_name), None)
            
            if not migration:
                logger.error(f"Migration file for {migration_name} not found")
                return False
            
            # Roll back the migration
            logger.info(f"Rolling back migration: {migration.name}")
            success = await migration.down()
            
            if success:
                # Remove the migration record
                await db[self.migrations_collection].delete_one({"name": migration_name})
                logger.info(f"Migration {migration_name} rolled back successfully")
                return True
            else:
                logger.error(f"Rolling back migration {migration_name} failed")
                return False
                
        except Exception as e:
            logger.error(f"Error rolling back migration {migration_name}: {str(e)}", exc_info=True)
            return False
    
    async def run_migrations(self, up_to: str = None) -> Dict[str, Any]:
        """Run all pending migrations"""
        await self.initialize()
        
        # Get applied and available migrations
        applied_migrations = await self.get_applied_migrations()
        available_migrations = await self.get_available_migrations()
        
        applied_names = [m["name"] for m in applied_migrations]
        pending_migrations = [m for m in available_migrations if m.name not in applied_names]
        
        # Apply migrations until up_to if specified
        results = {
            "total": len(pending_migrations),
            "applied": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }
        
        for migration in pending_migrations:
            # Skip if we've reached the up_to migration
            if up_to and migration.name > up_to:
                results["skipped"] += 1
                results["details"].append({
                    "name": migration.name,
                    "description": migration.description,
                    "status": "skipped"
                })
                continue
                
            # Apply the migration
            success = await self.apply_migration(migration)
            
            if success:
                results["applied"] += 1
                results["details"].append({
                    "name": migration.name,
                    "description": migration.description,
                    "status": "applied"
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "name": migration.name,
                    "description": migration.description,
                    "status": "failed"
                })
                break  # Stop on first failure
        
        return results
    
    async def rollback_migrations(self, count: int = 1) -> Dict[str, Any]:
        """Roll back the specified number of migrations"""
        await self.initialize()
        
        # Get applied migrations in reverse order (most recent first)
        applied_migrations = await self.get_applied_migrations()
        applied_migrations.reverse()
        
        results = {
            "total": min(count, len(applied_migrations)),
            "rolled_back": 0,
            "failed": 0,
            "details": []
        }
        
        # Roll back the specified number of migrations
        for i, migration in enumerate(applied_migrations):
            if i >= count:
                break
                
            success = await self.rollback_migration(migration["name"])
            
            if success:
                results["rolled_back"] += 1
                results["details"].append({
                    "name": migration["name"],
                    "description": migration.get("description", ""),
                    "status": "rolled_back"
                })
            else:
                results["failed"] += 1
                results["details"].append({
                    "name": migration["name"],
                    "description": migration.get("description", ""),
                    "status": "failed"
                })
                break  # Stop on first failure
        
        return results 