from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

import chromadb
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import DESCENDING

from config import get_settings

logger = logging.getLogger(__name__)


class MemoryService:
    """
    Memory service with MongoDB for structured data and ChromaDB for vector memory.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        
        # MongoDB connection
        self.mongo_client = AsyncIOMotorClient(self.settings.mongodb_uri)
        self.db = self.mongo_client[self.settings.mongodb_database]
        
        # Collections
        self.users = self.db.users
        self.conversations = self.db.conversations
        self.messages = self.db.messages
        self.knowledge = self.db.knowledge
        
        # Indexes will be created on startup in main.py
        
        # ChromaDB connection
        try:
            self.chroma_client = chromadb.HttpClient(
                host=self.settings.chroma_host,
                port=self.settings.chroma_port
            )
            self.user_memory = self.chroma_client.get_or_create_collection(
                name="user_memory",
                metadata={"hnsw:space": "cosine"}
            )
            self.knowledge_base = self.chroma_client.get_or_create_collection(
                name="knowledge_base",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.warning(f"ChromaDB connection failed: {e}")
            self.chroma_client = None
            self.user_memory = None
            self.knowledge_base = None

    # ===================
    # User Management
    # ===================

    async def get_or_create_user(self, identifier: dict) -> dict:
        """Get existing user or create new one"""
        # Build query from available identifiers
        query = {"$or": []}
        
        if identifier.get("phone"):
            query["$or"].append({"phone": identifier["phone"]})
        if identifier.get("whatsapp_id"):
            query["$or"].append({"whatsapp_id": identifier["whatsapp_id"]})
        if identifier.get("email"):
            query["$or"].append({"email": identifier["email"]})
        
        if not query["$or"]:
            # No valid identifier, create new user
            return await self._create_user(identifier)
        
        user = await self.users.find_one(query)
        
        if user:
            # Update last contact
            await self.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_contact": datetime.utcnow()}}
            )
            return user
        
        return await self._create_user(identifier)

    async def _create_user(self, identifier: dict) -> dict:
        """Create new user"""
        user = {
            "_id": str(uuid4()),
            "phone": identifier.get("phone"),
            "whatsapp_id": identifier.get("whatsapp_id"),
            "email": identifier.get("email"),
            "name": identifier.get("name"),
            "created_at": datetime.utcnow(),
            "last_contact": datetime.utcnow(),
            "first_contact": datetime.utcnow(),
            "order_count": 0,
            "total_spent": 0,
            "conversation_count": 0,
            "tags": [],
            "preferences": {},
            "metadata": {}
        }
        
        await self.users.insert_one(user)
        logger.info(f"Created new user: {user['_id']}")
        return user

    async def update_user(self, user_id: str, updates: dict) -> bool:
        """Update user data"""
        result = await self.users.update_one(
            {"_id": user_id},
            {"$set": updates}
        )
        return result.modified_count > 0

    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        return await self.users.find_one({"_id": user_id})

    async def get_user_by_phone(self, phone: str) -> Optional[dict]:
        """Get user by phone number"""
        return await self.users.find_one({"phone": phone})

    # ===================
    # Conversation History
    # ===================

    async def create_conversation(self, user_id: str, channel: str = "whatsapp") -> dict:
        """Create new conversation"""
        conversation = {
            "_id": str(uuid4()),
            "user_id": user_id,
            "channel": channel,
            "status": "active",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "message_count": 0,
            "resolved": False,
            "escalated": False,
            "sentiment": "neutral",
            "tags": [],
            "metadata": {},
            # Classification fields
            "intent": None,
            "priority": "medium",
            "category": None,
            "language": "ar"
        }
        
        await self.conversations.insert_one(conversation)
        
        # Update user conversation count
        await self.users.update_one(
            {"_id": user_id},
            {"$inc": {"conversation_count": 1}}
        )
        
        return conversation

    async def get_active_conversation(self, user_id: str) -> Optional[dict]:
        """Get active conversation for user"""
        return await self.conversations.find_one({
            "user_id": user_id,
            "status": "active"
        })

    async def get_or_create_conversation(self, user_id: str, channel: str = "whatsapp") -> dict:
        """Get active conversation or create new one"""
        conversation = await self.get_active_conversation(user_id)
        if conversation:
            return conversation
        return await self.create_conversation(user_id, channel)

    async def close_conversation(self, conversation_id: str, resolved: bool = True) -> bool:
        """Close a conversation"""
        result = await self.conversations.update_one(
            {"_id": conversation_id},
            {
                "$set": {
                    "status": "closed",
                    "resolved": resolved,
                    "closed_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

    # ===================
    # Messages
    # ===================

    async def append_message(
        self, 
        conversation_id: str, 
        role: str, 
        content: str,
        metadata: Optional[dict] = None
    ) -> dict:
        """Add message to conversation"""
        message = {
            "_id": str(uuid4()),
            "conversation_id": conversation_id,
            "role": role,  # "user" or "assistant"
            "content": content,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        await self.messages.insert_one(message)
        
        # Update conversation
        await self.conversations.update_one(
            {"_id": conversation_id},
            {
                "$inc": {"message_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return message

    async def get_recent_messages(
        self, 
        conversation_id: str, 
        limit: int = 10
    ) -> list[dict]:
        """Get recent messages from conversation (chronological order)"""
        from pymongo import ASCENDING
        
        # First, get total count to determine skip
        total = await self.messages.count_documents({"conversation_id": conversation_id})
        skip = max(0, total - limit)
        
        # Get messages sorted by timestamp ascending (oldest first)
        cursor = self.messages.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", ASCENDING).skip(skip).limit(limit)
        
        messages = await cursor.to_list(length=limit)
        return messages  # Already in chronological order

    async def get_all_messages(
        self, 
        conversation_id: str
    ) -> list[dict]:
        """Get all messages from conversation in chronological order"""
        from pymongo import ASCENDING
        
        cursor = self.messages.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", ASCENDING)
        
        messages = await cursor.to_list(length=1000)  # Limit to 1000 messages
        return messages

    async def get_user_history(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> list[dict]:
        """Get all messages for a user across conversations"""
        # Get user's conversations
        conversations = await self.conversations.find(
            {"user_id": user_id}
        ).to_list(length=100)
        
        conversation_ids = [c["_id"] for c in conversations]
        
        # Get messages
        cursor = self.messages.find(
            {"conversation_id": {"$in": conversation_ids}}
        ).sort("timestamp", DESCENDING).limit(limit)
        
        messages = await cursor.to_list(length=limit)
        return list(reversed(messages))

    # ===================
    # Vector Memory (ChromaDB)
    # ===================

    async def store_user_fact(self, user_id: str, fact: str) -> bool:
        """Store a fact about user in vector memory"""
        if not self.user_memory:
            return False
        
        try:
            self.user_memory.add(
                ids=[f"{user_id}_{uuid4().hex[:8]}"],
                documents=[fact],
                metadatas=[{
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }]
            )
            return True
        except Exception as e:
            logger.error(f"ChromaDB store error: {e}")
            return False

    async def recall_user_facts(
        self, 
        user_id: str, 
        query: str, 
        limit: int = 5
    ) -> list[str]:
        """Recall relevant facts about user"""
        if not self.user_memory:
            return []
        
        try:
            results = self.user_memory.query(
                query_texts=[query],
                n_results=limit,
                where={"user_id": user_id}
            )
            
            if results and results["documents"]:
                return results["documents"][0]
            return []
        except Exception as e:
            logger.error(f"ChromaDB query error: {e}")
            return []

    # ===================
    # Knowledge Base
    # ===================

    async def add_knowledge(self, content: str, category: str = "general") -> bool:
        """Add knowledge to vector database"""
        if not self.knowledge_base:
            # Fallback to MongoDB
            await self.knowledge.insert_one({
                "_id": str(uuid4()),
                "content": content,
                "category": category,
                "created_at": datetime.utcnow()
            })
            return True
        
        try:
            self.knowledge_base.add(
                ids=[str(uuid4())],
                documents=[content],
                metadatas=[{"category": category}]
            )
            return True
        except Exception as e:
            logger.error(f"Knowledge add error: {e}")
            return False

    async def search_knowledge(self, query: str, limit: int = 5) -> list[str]:
        """Search knowledge base"""
        if not self.knowledge_base:
            # Fallback to MongoDB text search
            cursor = self.knowledge.find(
                {"$text": {"$search": query}}
            ).limit(limit)
            results = await cursor.to_list(length=limit)
            return [r["content"] for r in results]
        
        try:
            results = self.knowledge_base.query(
                query_texts=[query],
                n_results=limit
            )
            
            if results and results["documents"]:
                return results["documents"][0]
            return []
        except Exception as e:
            logger.error(f"Knowledge search error: {e}")
            return []

    # ===================
    # Analytics
    # ===================

    async def get_conversation_stats(self, days: int = 7) -> dict:
        """Get conversation statistics"""
        from datetime import timedelta
        
        since = datetime.utcnow() - timedelta(days=days)
        
        total = await self.conversations.count_documents({
            "created_at": {"$gte": since}
        })
        
        resolved = await self.conversations.count_documents({
            "created_at": {"$gte": since},
            "resolved": True
        })
        
        escalated = await self.conversations.count_documents({
            "created_at": {"$gte": since},
            "escalated": True
        })
        
        return {
            "total": total,
            "resolved": resolved,
            "escalated": escalated,
            "resolution_rate": resolved / total if total > 0 else 0
        }

    async def get_user_stats(self) -> dict:
        """Get user statistics"""
        total = await self.users.count_documents({})
        
        from datetime import timedelta
        today = datetime.utcnow().replace(hour=0, minute=0, second=0)
        
        active_today = await self.users.count_documents({
            "last_contact": {"$gte": today}
        })
        
        new_today = await self.users.count_documents({
            "created_at": {"$gte": today}
        })
        
        return {
            "total": total,
            "active_today": active_today,
            "new_today": new_today
        }
