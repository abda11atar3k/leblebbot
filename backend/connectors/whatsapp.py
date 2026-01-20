from __future__ import annotations

import asyncio
import logging
import random
from datetime import datetime
from typing import Any, Optional

from connectors.base import BaseConnector
from services.evolution_client import EvolutionClient

logger = logging.getLogger(__name__)


class WhatsAppConnector(EvolutionClient, BaseConnector):
    """
    WhatsApp connector using Evolution API.
    Includes typing simulation, rate limiting, and message variation.
    Inherits connection pooling from EvolutionClient.
    """

    connector_type = "whatsapp"

    def __init__(self, instance_name: Optional[str] = None) -> None:
        EvolutionClient.__init__(self, instance_name)
        
        # Rate limiting state
        self._message_counts = {}  # {number: {hour: count, day: count}}

    # ===================
    # Instance Management
    # ===================

    async def create_instance(self) -> dict:
        """Create new WhatsApp instance with full sync enabled"""
        payload = {
            "instanceName": self.instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS",
            "rejectCall": False,
            "groupsIgnore": False,
            "alwaysOnline": True,
            "readMessages": True,
            "readStatus": True,
            "syncFullHistory": True  # Enable full history sync
        }
        result = await self._request("POST", "/instance/create", payload)
        
        # Auto-setup webhook after instance creation
        if result.get("success"):
            await self.setup_webhook()
        
        return result
    
    async def setup_webhook(self) -> dict:
        """Configure webhook to receive real-time message events"""
        payload = {
            "webhook": {
                "enabled": True,
                "url": "http://backend:8000/webhook/evolution",
                "webhookByEvents": False,
                "webhookBase64": False,
                "events": [
                    "MESSAGES_UPSERT",
                    "MESSAGES_UPDATE",
                    "SEND_MESSAGE",
                    "CONNECTION_UPDATE"
                ]
            }
        }
        result = await self._request(
            "POST",
            f"/webhook/set/{self.instance_name}",
            payload
        )
        if result.get("success"):
            logger.info(f"Webhook configured for instance {self.instance_name}")
        else:
            logger.warning(f"Failed to configure webhook: {result}")
        return result

    async def connect(self) -> dict:
        """Connect/create instance and get QR code"""
        # First check if instance exists and is connected
        status = await self.status()
        
        if status.get("connected"):
            # Ensure webhook is configured even for existing connections
            await self.setup_webhook()
            return {"success": True, "already_connected": True, **status}
        
        # Create new instance if not found or unknown state
        state = status.get("state", "unknown")
        if not status.get("success") or state in ("unknown", "not_found", "close"):
            logger.info(f"Instance state is '{state}', creating new instance...")
            create_result = await self.create_instance()
            if not create_result.get("success"):
                logger.error(f"Failed to create instance: {create_result}")
                return create_result
            logger.info(f"Instance created successfully")
        else:
            # Instance exists but not connected - ensure webhook is setup
            await self.setup_webhook()
        
        # Get QR code for connection
        return await self.get_qr_code()

    async def disconnect(self) -> dict:
        """Disconnect and delete instance"""
        return await self._request(
            "DELETE", 
            f"/instance/delete/{self.instance_name}"
        )

    async def logout(self) -> dict:
        """Logout from WhatsApp and delete instance completely (fresh start)"""
        # First logout from WhatsApp
        logout_result = await self._request(
            "DELETE",
            f"/instance/logout/{self.instance_name}"
        )
        
        # Then delete the instance completely to remove all old data
        delete_result = await self._request(
            "DELETE", 
            f"/instance/delete/{self.instance_name}"
        )
        
        logger.info(f"Instance {self.instance_name} logged out and deleted for fresh start")
        
        return {
            "success": True,
            "logout": logout_result,
            "delete": delete_result,
            "message": "Instance deleted. Ready for new connection."
        }

    async def status(self) -> dict:
        """Get instance connection status"""
        result = await self._request(
            "GET", 
            f"/instance/connectionState/{self.instance_name}"
        )
        
        if result.get("success"):
            data = result.get("data", {})
            # Evolution API v2 can have nested instance object
            if "instance" in data:
                state = data.get("instance", {}).get("state", "unknown")
            else:
                state = data.get("state", "unknown")
            
            return {
                "success": True,
                "connected": state == "open",
                "state": state,
                "instance": self.instance_name
            }
        
        # Check if it's a 404 (instance doesn't exist)
        if result.get("status") == 404:
            return {"success": False, "connected": False, "state": "not_found", "instance": self.instance_name}
        
        return {"success": False, "connected": False, "state": "unknown", "error": result.get("error")}

    async def get_qr_code(self) -> dict:
        """Get QR code for connection"""
        result = await self._request(
            "GET",
            f"/instance/connect/{self.instance_name}"
        )
        
        if result.get("success"):
            qr_data = result.get("data", {})
            # Evolution API v2 format: { qrcode: { base64: "...", pairingCode: "..." } }
            # or direct base64 in data
            if isinstance(qr_data, dict):
                # Check nested qrcode object
                if "qrcode" in qr_data and isinstance(qr_data["qrcode"], dict):
                    qr_info = qr_data["qrcode"]
                    return {
                        "success": True,
                        "qr_code": qr_info.get("code"),
                        "base64": qr_info.get("base64"),
                        "pairing_code": qr_info.get("pairingCode")
                    }
                # Check direct base64 field
                elif "base64" in qr_data:
                    return {
                        "success": True,
                        "qr_code": qr_data.get("qrcode") or qr_data.get("code"),
                        "base64": qr_data.get("base64")
                    }
                # Legacy format
                elif "qrcode" in qr_data and isinstance(qr_data["qrcode"], str):
                    return {
                        "success": True,
                        "qr_code": qr_data["qrcode"],
                        "base64": qr_data.get("base64")
                    }
            
            logger.warning(f"Unexpected QR code format: {qr_data}")
            return {"success": False, "error": "Unexpected QR code format", "raw": qr_data}
        
        error_msg = result.get("error") or result.get("data", {}).get("message", "Could not get QR code")
        return {"success": False, "error": error_msg}

    async def get_instance_info(self) -> dict:
        """Get instance information"""
        return await self._request(
            "GET",
            f"/instance/fetchInstances"
        )

    async def get_sync_status(self) -> dict:
        """Get sync status with contacts/chats/messages counts"""
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
                    "connected": inst.get("connectionStatus") == "open",
                    "state": inst.get("connectionStatus", "unknown"),
                    "contacts": counts.get("Contact", 0),
                    "chats": counts.get("Chat", 0),
                    "messages": counts.get("Message", 0)
                }
        return {"success": False, "connected": False, "state": "unknown", "contacts": 0, "chats": 0, "messages": 0}

    # ===================
    # Messaging
    # ===================

    async def send_message(
        self, 
        to: str, 
        message: str,
        simulate_typing: bool = True,
        vary_message: bool = True
    ) -> dict:
        """
        Send text message with human-like behavior.
        
        Args:
            to: Phone number (with country code)
            message: Message text
            simulate_typing: Whether to simulate typing delay
            vary_message: Whether to add slight variations
        """
        # Normalize phone number
        to = self._normalize_phone(to)
        
        # Vary message slightly
        if vary_message:
            message = self._vary_message(message)
        
        # Simulate typing
        if simulate_typing:
            await self._simulate_typing(to, message)
        
        # Send message - Evolution API v2 format
        payload = {
            "number": to,
            "text": message
        }
        
        result = await self._request(
            "POST",
            f"/message/sendText/{self.instance_name}",
            payload
        )
        
        # Update rate limit counters
        self._update_message_count(to)
        
        return result

    async def send_image(
        self, 
        to: str, 
        image_url: str,
        caption: str = ""
    ) -> dict:
        """Send image message"""
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "mediatype": "image",
            "media": image_url,
            "caption": caption
        }
        
        return await self._request(
            "POST",
            f"/message/sendMedia/{self.instance_name}",
            payload
        )

    async def send_audio(self, to: str, audio_url: str) -> dict:
        """Send audio/voice message"""
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "audio": audio_url
        }
        
        return await self._request(
            "POST",
            f"/message/sendWhatsAppAudio/{self.instance_name}",
            payload
        )

    async def send_document(
        self, 
        to: str, 
        document_url: str,
        filename: str
    ) -> dict:
        """Send document"""
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "mediatype": "document",
            "media": document_url,
            "fileName": filename
        }
        
        return await self._request(
            "POST",
            f"/message/sendMedia/{self.instance_name}",
            payload
        )

    async def send_buttons(
        self, 
        to: str, 
        text: str,
        buttons: list[dict]
    ) -> dict:
        """Send message with buttons"""
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "buttonMessage": {
                "text": text,
                "buttons": buttons,
                "footerText": ""
            }
        }
        
        return await self._request(
            "POST",
            f"/message/sendButtons/{self.instance_name}",
            payload
        )

    async def send_list(
        self, 
        to: str, 
        title: str,
        description: str,
        button_text: str,
        sections: list[dict]
    ) -> dict:
        """Send list message"""
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "listMessage": {
                "title": title,
                "description": description,
                "buttonText": button_text,
                "footerText": "",
                "sections": sections
            }
        }
        
        return await self._request(
            "POST",
            f"/message/sendList/{self.instance_name}",
            payload
        )

    # ===================
    # Presence & Status
    # ===================

    async def set_presence(self, to: str, presence: str = "composing") -> dict:
        """
        Set presence/typing indicator.
        
        presence: "composing", "recording", "available", "unavailable"
        """
        to = self._normalize_phone(to)
        
        payload = {
            "number": to,
            "presence": presence
        }
        
        return await self._request(
            "POST",
            f"/chat/updatePresence/{self.instance_name}",
            payload
        )

    async def mark_as_read(self, to: str, message_id: str) -> dict:
        """Mark message as read"""
        to = self._normalize_phone(to)
        
        payload = {
            "readMessages": [
                {
                    "remoteJid": f"{to}@s.whatsapp.net",
                    "id": message_id
                }
            ]
        }
        
        return await self._request(
            "POST",
            f"/chat/markMessageAsRead/{self.instance_name}",
            payload
        )

    # ===================
    # Webhook Handling
    # ===================

    async def handle_webhook(self, payload: dict) -> dict:
        """Process incoming webhook from Evolution API"""
        event = payload.get("event")
        data = payload.get("data", {})
        instance = payload.get("instance")
        
        logger.info(f"Webhook received: {event} for instance {instance}")
        
        if event == "messages.upsert":
            return await self._handle_incoming_message(data)
        elif event == "connection.update":
            return await self._handle_connection_update(data)
        elif event == "qrcode.updated":
            return await self._handle_qr_update(data)
        else:
            return {"processed": False, "event": event}

    async def _handle_incoming_message(self, data: dict) -> dict:
        """Handle incoming message webhook"""
        message = data.get("message", {})
        key = data.get("key", {})
        
        # Skip if message is from us
        if key.get("fromMe"):
            return {"processed": False, "reason": "self_message"}
        
        # Extract sender
        remote_jid = key.get("remoteJid", "")
        sender = remote_jid.replace("@s.whatsapp.net", "")
        
        # Extract message content
        content = None
        message_type = "text"
        media_url = None
        
        if message.get("conversation"):
            content = message["conversation"]
        elif message.get("extendedTextMessage"):
            content = message["extendedTextMessage"].get("text")
        elif message.get("audioMessage"):
            message_type = "voice"
            # TODO: Download and transcribe
            content = "[Voice message]"
        elif message.get("imageMessage"):
            message_type = "image"
            content = message["imageMessage"].get("caption", "[Image]")
        else:
            content = "[Unsupported message type]"
        
        return {
            "processed": True,
            "sender": sender,
            "content": content,
            "message_type": message_type,
            "media_url": media_url,
            "raw": data
        }

    async def _handle_connection_update(self, data: dict) -> dict:
        """Handle connection status update"""
        state = data.get("state")
        logger.info(f"Connection state updated: {state}")
        return {"processed": True, "state": state}

    async def _handle_qr_update(self, data: dict) -> dict:
        """Handle QR code update"""
        logger.info("QR code updated")
        return {"processed": True, "qr_updated": True}

    # ===================
    # Human-like Behavior
    # ===================

    async def _simulate_typing(self, to: str, message: str) -> None:
        """
        Simulate human typing behavior.
        Optimized for faster response while still appearing natural.
        """
        if not self.settings.typing_simulation:
            return
        
        # Calculate typing time based on message length
        chars = len(message)
        typing_speed = self.settings.typing_speed  # chars per second (default: 15)
        
        base_time = chars / typing_speed
        
        # Add small randomness (reduced from before)
        variance = base_time * random.uniform(-0.1, 0.15)
        thinking_time = random.uniform(0.3, 0.8)  # Reduced from 1-3 seconds
        
        total_time = thinking_time + base_time + variance
        
        # Cap at reasonable limits - much faster now
        total_time = min(total_time, self.settings.max_response_delay)  # Max 4 seconds
        total_time = max(total_time, self.settings.min_response_delay)  # Min 0.5 seconds
        
        # Send single typing indicator and wait
        await self.set_presence(to, "composing")
        await asyncio.sleep(total_time)

    def _vary_message(self, message: str) -> str:
        """Add slight variations to message"""
        # Greeting variations
        greetings = {
            "أهلاً": ["أهلاً", "اهلا", "هلا", "أهلاً بيك"],
            "مرحباً": ["مرحباً", "مرحبا", "مرحب"],
        }
        
        for original, variations in greetings.items():
            if original in message:
                message = message.replace(original, random.choice(variations), 1)
                break
        
        # Random emoji variation (sometimes)
        if random.random() < 0.1:
            emojis = ["😊", "👍", "🙏", "✨"]
            if not any(e in message for e in emojis):
                message = message + " " + random.choice(emojis)
        
        return message

    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number format"""
        # Remove any non-digit characters
        phone = "".join(c for c in phone if c.isdigit())
        
        # Add Egypt country code if needed
        if phone.startswith("01") and len(phone) == 11:
            phone = "20" + phone
        elif phone.startswith("1") and len(phone) == 10:
            phone = "20" + phone
        
        return phone

    def _update_message_count(self, to: str) -> None:
        """Update message count for rate limiting"""
        now = datetime.utcnow()
        hour_key = now.strftime("%Y%m%d%H")
        day_key = now.strftime("%Y%m%d")
        
        if to not in self._message_counts:
            self._message_counts[to] = {}
        
        counts = self._message_counts[to]
        counts[f"hour_{hour_key}"] = counts.get(f"hour_{hour_key}", 0) + 1
        counts[f"day_{day_key}"] = counts.get(f"day_{day_key}", 0) + 1

    def get_message_counts(self, to: str) -> dict:
        """Get message counts for rate limiting"""
        now = datetime.utcnow()
        hour_key = now.strftime("%Y%m%d%H")
        day_key = now.strftime("%Y%m%d")
        
        counts = self._message_counts.get(to, {})
        
        return {
            "hour": counts.get(f"hour_{hour_key}", 0),
            "day": counts.get(f"day_{day_key}", 0)
        }
