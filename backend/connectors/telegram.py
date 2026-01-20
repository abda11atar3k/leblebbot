from __future__ import annotations

import logging
from typing import Optional

import aiohttp

from connectors.base import BaseConnector

logger = logging.getLogger(__name__)


class TelegramConnector(BaseConnector):
    """
    Telegram Bot connector.
    Uses Telegram Bot API.
    
    Status: Coming Soon
    """

    connector_type = "telegram"

    def __init__(self, bot_token: Optional[str] = None) -> None:
        self.bot_token = bot_token
        self.bot_info: Optional[dict] = None
        self._connected = False
        self.base_url = "https://api.telegram.org/bot"

    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        payload: Optional[dict] = None
    ) -> dict:
        """Make request to Telegram Bot API"""
        if not self.bot_token:
            return {"success": False, "error": "Bot token not configured"}
        
        url = f"{self.base_url}{self.bot_token}/{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                if method == "GET":
                    async with session.get(url) as response:
                        data = await response.json()
                        return {"success": data.get("ok", False), "data": data}
                else:
                    async with session.post(url, json=payload) as response:
                        data = await response.json()
                        return {"success": data.get("ok", False), "data": data}
        except Exception as e:
            logger.error(f"Telegram API error: {e}")
            return {"success": False, "error": str(e)}

    async def connect(self) -> dict:
        """Connect to Telegram (verify bot token)"""
        if not self.bot_token:
            return {
                "success": False,
                "error": "Telegram integration coming soon - Bot token required",
                "status": "coming_soon"
            }
        
        # Verify bot token
        result = await self._request("GET", "getMe")
        
        if result.get("success"):
            self.bot_info = result.get("data", {}).get("result")
            self._connected = True
            return {
                "success": True,
                "connected": True,
                "bot": self.bot_info
            }
        
        return {"success": False, "error": "Invalid bot token"}

    async def disconnect(self) -> dict:
        """Disconnect from Telegram"""
        self._connected = False
        self.bot_info = None
        return {"success": True}

    async def status(self) -> dict:
        """Get connection status"""
        return {
            "success": True,
            "connected": self._connected,
            "status": "coming_soon" if not self.bot_token else "ready",
            "bot": self.bot_info
        }

    async def send_message(
        self, 
        to: str, 
        message: str,
        **kwargs
    ) -> dict:
        """Send message via Telegram"""
        if not self._connected:
            return {"success": False, "error": "Not connected"}
        
        payload = {
            "chat_id": to,
            "text": message,
            "parse_mode": "HTML"
        }
        
        return await self._request("POST", "sendMessage", payload)

    async def send_photo(
        self, 
        to: str, 
        photo_url: str,
        caption: str = ""
    ) -> dict:
        """Send photo via Telegram"""
        if not self._connected:
            return {"success": False, "error": "Not connected"}
        
        payload = {
            "chat_id": to,
            "photo": photo_url,
            "caption": caption
        }
        
        return await self._request("POST", "sendPhoto", payload)

    async def send_buttons(
        self, 
        to: str, 
        text: str,
        buttons: list[list[dict]]
    ) -> dict:
        """Send message with inline keyboard"""
        if not self._connected:
            return {"success": False, "error": "Not connected"}
        
        payload = {
            "chat_id": to,
            "text": text,
            "reply_markup": {
                "inline_keyboard": buttons
            }
        }
        
        return await self._request("POST", "sendMessage", payload)

    async def handle_webhook(self, payload: dict) -> dict:
        """Handle incoming Telegram webhook"""
        logger.info(f"Telegram webhook received")
        
        # Parse update
        message = payload.get("message", {})
        callback_query = payload.get("callback_query", {})
        
        if message:
            chat_id = message.get("chat", {}).get("id")
            text = message.get("text", "")
            
            return {
                "processed": True,
                "sender": str(chat_id),
                "content": text,
                "message_type": "text",
                "raw": message
            }
        
        if callback_query:
            chat_id = callback_query.get("message", {}).get("chat", {}).get("id")
            data = callback_query.get("data", "")
            
            return {
                "processed": True,
                "sender": str(chat_id),
                "content": data,
                "message_type": "callback",
                "raw": callback_query
            }
        
        return {"processed": False}

    async def set_webhook(self, url: str) -> dict:
        """Set webhook URL for receiving updates"""
        payload = {
            "url": url,
            "allowed_updates": ["message", "callback_query"]
        }
        
        return await self._request("POST", "setWebhook", payload)

    async def delete_webhook(self) -> dict:
        """Delete webhook"""
        return await self._request("POST", "deleteWebhook")
