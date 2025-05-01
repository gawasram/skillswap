import os
import time
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from app.config.settings import get_settings

settings = get_settings()

# MongoDB client instance
client = None
db = None

async def connect_to_mongodb():
    """Connect to MongoDB Atlas"""
    global client, db
    try:
        # Create a new client and connect to the server
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=30000,
            maxPoolSize=50,  # Increased connection pool for production
            minPoolSize=10,  # Minimum connections to maintain
            maxIdleTimeMS=60000,  # Close idle connections after 1 minute
            waitQueueTimeoutMS=10000  # Wait time for connection from pool
        )
        
        # Send a ping to confirm a successful connection
        await client.admin.command('ping')
        print("Connected to MongoDB!")
        
        # Get database instance
        db = client[settings.mongodb_db_name]
        
        # Initialize indexes on startup if in production
        if settings.environment == "production":
            from app.utils.db_indexes import create_indexes
            await create_indexes()
        
        # Return client for testing purposes
        return client
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongodb_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

async def check_db_connection() -> bool:
    """Check if the database connection is healthy"""
    try:
        # Try to ping the database
        if client:
            await client.admin.command('ping')
            return True
        return False
    except Exception:
        return False

def get_connection_stats():
    """Get database connection pool statistics"""
    if not client:
        return None
        
    return {
        "maxPoolSize": client.options.pool_options.max_pool_size,
        "minPoolSize": client.options.pool_options.min_pool_size,
        "totalConnections": client.get_io_loop().run_sync(lambda: client._topology.description.server_descriptions()),
        "address": client.address if hasattr(client, 'address') else None
    } 