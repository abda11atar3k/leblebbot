"""
Evolution API Service
Queries Evolution API directly for WhatsApp statistics and real-time data.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any, Optional

import aiohttp

from config import get_settings

logger = logging.getLogger(__name__)


class EvolutionService:
    """
    Service for querying Evolution API directly for statistics.
    Provides real-time WhatsApp data including messages, contacts, and chats.
    """

    def __init__(self, instance_name: Optional[str] = None) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.evolution_api_url.rstrip("/")
        self.api_key = self.settings.evolution_api_key
        self.instance_name = instance_name or self.settings.evolution_instance_name

    async def _request(
        self,
        method: str,
        path: str,
        payload: Optional[dict] = None,
        timeout: int = 30
    ) -> dict:
        """Make HTTP request to Evolution API"""
        headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }
        url = f"{self.base_url}{path}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method,
                    url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    data = await response.json(content_type=None)
                    return {
                        "success": response.status in (200, 201),
                        "status": response.status,
                        "data": data
                    }
        except Exception as e:
            logger.error(f"Evolution API request error: {e}")
            return {"success": False, "error": str(e)}

    async def get_all_instances(self) -> list[dict]:
        """Get all WhatsApp instances and their stats"""
        result = await self._request("GET", "/instance/fetchInstances")
        
        if result.get("success") and result.get("data"):
            return result["data"]
        return []

    async def get_instance_stats(self) -> dict:
        """Get statistics for a specific instance"""
        result = await self._request(
            "GET",
            f"/instance/fetchInstances?instanceName={self.instance_name}"
        )
        
        if result.get("success") and result.get("data"):
            instances = result["data"]
            if instances:
                inst = instances[0]
                counts = inst.get("_count", {})
                return {
                    "success": True,
                    "instance_name": inst.get("name", self.instance_name),
                    "connected": inst.get("connectionStatus") == "open",
                    "connection_status": inst.get("connectionStatus", "unknown"),
                    "contacts": counts.get("Contact", 0),
                    "chats": counts.get("Chat", 0),
                    "messages": counts.get("Message", 0),
                    "owner_jid": inst.get("ownerJid"),
                    "profile_name": inst.get("profileName"),
                    "profile_picture": inst.get("profilePicUrl"),
                }
        
        return {
            "success": False,
            "connected": False,
            "connection_status": "unknown",
            "contacts": 0,
            "chats": 0,
            "messages": 0
        }

    async def get_platform_stats(self) -> dict:
        """
        Get message counts broken down by platform.
        Currently only WhatsApp is supported via Evolution API.
        """
        # Get WhatsApp stats from Evolution API
        whatsapp_stats = await self.get_instance_stats()
        
        return {
            "whatsapp": {
                "total": whatsapp_stats.get("messages", 0),
                "contacts": whatsapp_stats.get("contacts", 0),
                "chats": whatsapp_stats.get("chats", 0),
                "connected": whatsapp_stats.get("connected", False),
                "today": 0  # Would need message timestamps to calculate
            },
            "messenger": {
                "total": 0,
                "contacts": 0,
                "chats": 0,
                "connected": False,
                "today": 0
            },
            "instagram": {
                "total": 0,
                "contacts": 0,
                "chats": 0,
                "connected": False,
                "today": 0
            },
            "telegram": {
                "total": 0,
                "contacts": 0,
                "chats": 0,
                "connected": False,
                "today": 0
            }
        }

    async def get_live_stats(self) -> dict:
        """
        Get real-time statistics for the monitor dashboard.
        """
        instance_stats = await self.get_instance_stats()
        platform_stats = await self.get_platform_stats()
        
        # Calculate total active conversations (chats with recent messages)
        total_messages = instance_stats.get("messages", 0)
        total_contacts = instance_stats.get("contacts", 0)
        total_chats = instance_stats.get("chats", 0)
        
        return {
            "total_messages": total_messages,
            "total_contacts": total_contacts,
            "total_chats": total_chats,
            "active_conversations": min(total_chats, 10),  # Estimate
            "messages_today": 0,  # Would need timestamp filtering
            "platforms": {
                "whatsapp": {
                    "active": 1 if instance_stats.get("connected") else 0,
                    "total": total_messages
                },
                "messenger": {
                    "active": 0,
                    "total": 0
                },
                "instagram": {
                    "active": 0,
                    "total": 0
                },
                "facebook": {
                    "active": 0,
                    "total": 0
                }
            },
            "sync_status": {
                "connected": instance_stats.get("connected", False),
                "connection_status": instance_stats.get("connection_status", "unknown"),
                "last_sync": datetime.utcnow().isoformat(),
                "instance_name": instance_stats.get("instance_name"),
                "profile_name": instance_stats.get("profile_name"),
            }
        }

    async def get_contacts(self, limit: int = 100) -> list[dict]:
        """Get contacts from Evolution API"""
        result = await self._request(
            "POST",
            f"/chat/findContacts/{self.instance_name}",
            {"where": {}}
        )
        
        if result.get("success") and result.get("data"):
            contacts = result["data"]
            return contacts[:limit] if isinstance(contacts, list) else []
        return []

    async def get_chats(self, limit: int = 50) -> list[dict]:
        """Get recent chats from Evolution API"""
        result = await self._request(
            "POST",
            f"/chat/findChats/{self.instance_name}",
            {}
        )
        
        if result.get("success") and result.get("data"):
            chats = result["data"]
            return chats[:limit] if isinstance(chats, list) else []
        return []

    async def get_messages(
        self, 
        remote_jid: str,
        limit: int = 50,
        page: int = 1
    ) -> dict:
        """Get messages for a specific chat. Returns dict with records and total.
        
        Args:
            remote_jid: The WhatsApp JID for the chat
            limit: Number of messages per page (default 50)
            page: Page number (1-indexed, default 1)
        """
        logger.info(f"Fetching messages for {remote_jid}, limit={limit}, page={page}")
        result = await self._request(
            "POST",
            f"/chat/findMessages/{self.instance_name}",
            {
                "where": {
                    "key": {
                        "remoteJid": remote_jid
                    }
                },
                "limit": limit,
                "page": page
            }
        )
        
        # _request wraps response in {"success": bool, "data": original_response}
        # Evolution API returns {"messages": {"records": [...], "total": N}}
        if result.get("success") and result.get("data"):
            data = result["data"]
            messages_data = data.get("messages", {})
            if isinstance(messages_data, dict):
                records = messages_data.get("records", [])
                total = messages_data.get("total", len(records))
                logger.info(f"Found {len(records)} message records, total={total}")
                return {
                    "records": records if isinstance(records, list) else [],
                    "total": total
                }
        return {"records": [], "total": 0}

    async def get_recent_conversations(self, limit: int = 20) -> list[dict]:
        """
        Get recent conversations with last message preview.
        Combines chats and contacts data for display.
        """
        chats = await self.get_chats(limit=limit)
        
        conversations = []
        for chat in chats:
            remote_jid = chat.get("remoteJid", "")
            phone = remote_jid.replace("@s.whatsapp.net", "").replace("@g.us", "")
            
            # Determine platform from jid
            is_group = "@g.us" in remote_jid
            
            conversation = {
                "id": chat.get("id", remote_jid),
                "phone": phone,
                "name": chat.get("name") or chat.get("pushName") or phone,
                "last_message": chat.get("lastMessage", {}).get("message", {}).get("conversation", ""),
                "last_message_time": chat.get("lastMessage", {}).get("messageTimestamp"),
                "platform": "whatsapp",
                "is_group": is_group,
                "unread_count": chat.get("unreadCount", 0),
                "status": "active" if chat.get("unreadCount", 0) > 0 else "inactive",
                "profile_picture": chat.get("profilePictureUrl"),
            }
            conversations.append(conversation)
        
        # Sort by last message time (most recent first)
        conversations.sort(
            key=lambda x: x.get("last_message_time") or 0,
            reverse=True
        )
        
        return conversations[:limit]

    async def get_media_base64(self, message_key: dict) -> dict:
        """
        Get media file as base64 from Evolution API.
        Uses getBase64FromMediaMessage endpoint.
        
        Args:
            message_key: Message key object with id and remoteJid
            
        Returns:
            dict with base64 data and mimetype
        """
        result = await self._request(
            "POST",
            f"/chat/getBase64FromMediaMessage/{self.instance_name}",
            {
                "message": {
                    "key": message_key
                },
                "convertToMp4": False
            },
            timeout=60  # Longer timeout for media
        )
        
        if result.get("success") and result.get("data"):
            data = result["data"]
            return {
                "success": True,
                "base64": data.get("base64"),
                "mimetype": data.get("mimetype"),
            }
        
        return {"success": False, "error": result.get("error", "Failed to get media")}

    async def get_message_by_id(self, message_id: str, remote_jid: str) -> Optional[dict]:
        """
        Get a specific message by ID.
        """
        result = await self._request(
            "POST",
            f"/chat/findMessages/{self.instance_name}",
            {
                "where": {
                    "key": {
                        "id": message_id,
                        "remoteJid": remote_jid
                    }
                },
                "limit": 1
            }
        )
        
        if result.get("success") and result.get("data"):
            data = result["data"]
            messages_data = data.get("messages", {})
            if isinstance(messages_data, dict):
                records = messages_data.get("records", [])
                if records:
                    return records[0]
        return None

    async def get_group_participants(self, group_jid: str) -> list[dict]:
        """
        Get participants of a group with their real phone numbers.
        This maps @lid IDs to actual phone numbers.
        
        Args:
            group_jid: Group JID (e.g., "120363399908392402@g.us")
            
        Returns:
            List of participant dicts with id, phoneNumber, admin, name, imgUrl
        """
        result = await self._request(
            "GET",
            f"/group/participants/{self.instance_name}?groupJid={group_jid}",
            timeout=30
        )
        
        if result.get("success") and result.get("data"):
            data = result["data"]
            return data.get("participants", [])
        
        return []

    async def get_group_info(self, group_jid: str) -> dict:
        """
        Get group info including the real group name (subject).
        
        Args:
            group_jid: Group JID (e.g., "120363399908392402@g.us")
            
        Returns:
            Dict with group info including id, subject (name), pictureUrl, etc.
        """
        result = await self._request(
            "GET",
            f"/group/findGroupInfos/{self.instance_name}?groupJid={group_jid}",
            timeout=15
        )
        
        if result.get("success") and result.get("data"):
            return result["data"]
        
        # Also check if data is directly in result (some API versions)
        if result.get("id") and result.get("subject"):
            return result
        
        return {}


# Global service instance
_evolution_service: Optional[EvolutionService] = None


def get_evolution_service(instance_name: Optional[str] = None) -> EvolutionService:
    """Get or create Evolution service instance"""
    global _evolution_service
    
    if _evolution_service is None or instance_name:
        _evolution_service = EvolutionService(instance_name)
    
    return _evolution_service
