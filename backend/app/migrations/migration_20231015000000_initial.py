from app.utils.migrations import Migration
from app.config.database import db

class InitialMigration(Migration):
    """
    Initial migration to set up database structure
    """
    
    def __init__(self):
        super().__init__("migration_20231015000000_initial", "Initial migration to set up database structure")
    
    async def up(self) -> bool:
        """Apply the migration"""
        try:
            # Create required indexes
            await db.users.create_index("email", unique=True)
            await db.users.create_index("username", unique=True)
            
            # Create initial admin user if it doesn't exist
            from app.utils.auth import get_password_hash
            
            # Check if admin exists
            admin = await db.users.find_one({"role": "admin"})
            if not admin:
                from datetime import datetime
                
                # Create admin user
                admin_user = {
                    "email": "admin@skillswap.com",
                    "username": "admin",
                    "full_name": "SkillSwap Admin",
                    "hashed_password": get_password_hash("ChangeThisPassword!"),
                    "role": "admin",
                    "permissions": ["read:all", "write:all", "admin:all"],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                await db.users.insert_one(admin_user)
                print("Created admin user: admin@skillswap.com")
            
            return True
        except Exception as e:
            print(f"Error in migration: {str(e)}")
            return False
    
    async def down(self) -> bool:
        """Rollback the migration"""
        try:
            # Remove admin user
            await db.users.delete_one({"username": "admin", "role": "admin"})
            
            # Drop indexes
            await db.users.drop_index("email_1")
            await db.users.drop_index("username_1")
            
            return True
        except Exception as e:
            print(f"Error in migration rollback: {str(e)}")
            return False 