from typing import List, Dict, Any

from app.config.database import db
from app.utils.logging import get_logger

logger = get_logger("database.indexes")

async def create_indexes() -> bool:
    """
    Create all required indexes for the database
    Returns True if successful, False otherwise
    """
    try:
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("role")
        await db.users.create_index("created_at")
        await db.users.create_index("last_active")
        
        # Sessions collection indexes
        await db.sessions.create_index("user_id")
        await db.sessions.create_index("created_at")
        await db.sessions.create_index("expires_at")
        
        # Skills collection indexes (assuming a skills collection)
        await db.skills.create_index("name")
        await db.skills.create_index("category")
        
        # User skills association indexes (assuming a user_skills collection)
        await db.user_skills.create_index([("user_id", 1), ("skill_id", 1)], unique=True)
        
        # Reviews collection indexes (assuming a reviews collection)
        await db.reviews.create_index("user_id")
        await db.reviews.create_index("reviewer_id")
        await db.reviews.create_index("skill_id")
        await db.reviews.create_index("rating")
        
        # Transactions collection indexes (assuming a transactions collection)
        await db.transactions.create_index("user_id")
        await db.transactions.create_index("type")
        await db.transactions.create_index("status")
        await db.transactions.create_index("created_at")
        
        # Notifications collection indexes (assuming a notifications collection)
        await db.notifications.create_index("user_id")
        await db.notifications.create_index("read")
        await db.notifications.create_index("created_at")
        
        logger.info("Successfully created database indexes")
        return True
        
    except Exception as e:
        logger.error(f"Error creating database indexes: {str(e)}", exc_info=True)
        return False

async def get_collection_stats() -> List[Dict[str, Any]]:
    """
    Get statistics about collections and their indexes
    """
    try:
        # Get list of collections
        collections = await db.list_collection_names()
        stats = []
        
        for collection_name in collections:
            # Get collection stats
            collection_stats = await db.command("collStats", collection_name)
            
            # Get indexes for the collection
            indexes = await db[collection_name].index_information()
            
            stats.append({
                "collection": collection_name,
                "count": collection_stats.get("count", 0),
                "size_mb": round(collection_stats.get("size", 0) / (1024 * 1024), 2),
                "avg_obj_size_bytes": collection_stats.get("avgObjSize", 0),
                "indexes": len(indexes),
                "index_size_mb": round(collection_stats.get("totalIndexSize", 0) / (1024 * 1024), 2),
                "index_details": [
                    {
                        "name": name,
                        "keys": info.get("key", {}),
                        "unique": info.get("unique", False)
                    }
                    for name, info in indexes.items()
                ]
            })
            
        return stats
        
    except Exception as e:
        logger.error(f"Error getting collection stats: {str(e)}", exc_info=True)
        return []

async def analyze_slow_queries() -> List[Dict[str, Any]]:
    """
    Analyze slow queries from the system.profile collection
    Requires MongoDB profiling to be enabled
    """
    try:
        # Check if profiling is enabled
        profiling_status = await db.command("profile", -1)
        current_level = profiling_status.get("was", 0)
        
        if current_level == 0:
            logger.warning("MongoDB profiling is not enabled. Enable with db.setProfilingLevel(1, {slowms: 100})")
            return []
        
        # Query the system.profile collection for slow queries
        slow_queries = await db.system.profile.find(
            {"op": {"$in": ["query", "update", "remove"]}},
            sort=[("millis", -1)],
            limit=20
        ).to_list(length=20)
        
        # Process and return the results
        return [
            {
                "operation": q.get("op"),
                "namespace": q.get("ns"),
                "query": q.get("query", q.get("command", {})),
                "duration_ms": q.get("millis"),
                "timestamp": q.get("ts"),
                "client": q.get("client"),
                "user": q.get("user")
            }
            for q in slow_queries
        ]
        
    except Exception as e:
        logger.error(f"Error analyzing slow queries: {str(e)}", exc_info=True)
        return [] 