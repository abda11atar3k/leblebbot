from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from config import get_settings
from connectors.whatsapp import WhatsAppConnector
from services.safety_service import SafetyService

logger = logging.getLogger(__name__)


class BroadcastService:
    """
    Broadcast service for sending messages to multiple users.
    Includes rate limiting and scheduling.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.safety = SafetyService()
        self.whatsapp = WhatsAppConnector()
        
        # In-memory queue (use Redis in production)
        self._queue: list[dict] = []
        self._history: list[dict] = []
        self._processing = False
        
        # Rate limiting
        self._sent_today = 0
        self._last_reset = datetime.utcnow().date()

    async def create_broadcast(
        self,
        message: str,
        recipients: list[str],
        scheduled_at: Optional[datetime] = None,
        channel: str = "whatsapp"
    ) -> dict:
        """
        Create a new broadcast.
        
        Args:
            message: Message content
            recipients: List of phone numbers
            scheduled_at: Optional scheduled time
            channel: Channel to use (whatsapp, messenger, etc.)
        """
        # Validate message
        validation = self.safety.validate_outgoing_message(
            message, 
            {"is_first_message": False}
        )
        
        if not validation["is_valid"]:
            return {
                "success": False,
                "error": "Message validation failed",
                "issues": validation["issues"]
            }
        
        # Check rate limits
        if self._sent_today >= self.settings.rate_limit_broadcasts_per_day:
            return {
                "success": False,
                "error": "Daily broadcast limit reached",
                "limit": self.settings.rate_limit_broadcasts_per_day
            }
        
        # Create broadcast
        broadcast = {
            "id": str(uuid4()),
            "message": message,
            "recipients": recipients,
            "total_recipients": len(recipients),
            "channel": channel,
            "status": "pending",
            "scheduled_at": scheduled_at,
            "created_at": datetime.utcnow(),
            "sent_count": 0,
            "failed_count": 0,
            "errors": []
        }
        
        if scheduled_at and scheduled_at > datetime.utcnow():
            broadcast["status"] = "scheduled"
        
        self._queue.append(broadcast)
        
        # Start processing if not scheduled
        if broadcast["status"] == "pending":
            asyncio.create_task(self._process_broadcast(broadcast["id"]))
        
        return {
            "success": True,
            "broadcast_id": broadcast["id"],
            "status": broadcast["status"],
            "total_recipients": len(recipients)
        }

    async def _process_broadcast(self, broadcast_id: str) -> None:
        """Process a broadcast in background"""
        broadcast = next(
            (b for b in self._queue if b["id"] == broadcast_id), 
            None
        )
        
        if not broadcast:
            return
        
        broadcast["status"] = "processing"
        broadcast["started_at"] = datetime.utcnow()
        
        logger.info(f"Processing broadcast {broadcast_id} to {len(broadcast['recipients'])} recipients")
        
        batch_size = 10
        batch_delay = 30  # seconds between batches
        
        recipients = broadcast["recipients"]
        
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i:i + batch_size]
            
            for phone in batch:
                try:
                    # Check daily limit
                    self._check_daily_reset()
                    if self._sent_today >= self.settings.rate_limit_broadcasts_per_day:
                        broadcast["status"] = "rate_limited"
                        return
                    
                    # Send message
                    result = await self.whatsapp.send_message(
                        to=phone,
                        message=broadcast["message"],
                        simulate_typing=True,
                        vary_message=True
                    )
                    
                    if result.get("success"):
                        broadcast["sent_count"] += 1
                        self._sent_today += 1
                    else:
                        broadcast["failed_count"] += 1
                        broadcast["errors"].append({
                            "phone": phone,
                            "error": result.get("error", "Unknown error")
                        })
                    
                    # Small delay between messages
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Broadcast send error: {e}")
                    broadcast["failed_count"] += 1
                    broadcast["errors"].append({
                        "phone": phone,
                        "error": str(e)
                    })
            
            # Delay between batches
            if i + batch_size < len(recipients):
                logger.info(f"Broadcast {broadcast_id}: Batch complete, waiting {batch_delay}s")
                await asyncio.sleep(batch_delay)
        
        broadcast["status"] = "completed"
        broadcast["completed_at"] = datetime.utcnow()
        
        # Move to history
        self._queue.remove(broadcast)
        self._history.append(broadcast)
        
        logger.info(
            f"Broadcast {broadcast_id} completed: "
            f"{broadcast['sent_count']} sent, {broadcast['failed_count']} failed"
        )

    def _check_daily_reset(self) -> None:
        """Reset daily counter if new day"""
        today = datetime.utcnow().date()
        if today > self._last_reset:
            self._sent_today = 0
            self._last_reset = today

    async def get_broadcast(self, broadcast_id: str) -> Optional[dict]:
        """Get broadcast by ID"""
        # Check queue
        broadcast = next(
            (b for b in self._queue if b["id"] == broadcast_id), 
            None
        )
        
        if broadcast:
            return broadcast
        
        # Check history
        return next(
            (b for b in self._history if b["id"] == broadcast_id), 
            None
        )

    async def list_broadcasts(
        self, 
        status: Optional[str] = None,
        limit: int = 50
    ) -> list[dict]:
        """List broadcasts"""
        all_broadcasts = self._queue + self._history
        
        if status:
            all_broadcasts = [b for b in all_broadcasts if b["status"] == status]
        
        # Sort by created_at desc
        all_broadcasts.sort(key=lambda x: x["created_at"], reverse=True)
        
        return all_broadcasts[:limit]

    async def cancel_broadcast(self, broadcast_id: str) -> dict:
        """Cancel a pending/scheduled broadcast"""
        broadcast = next(
            (b for b in self._queue if b["id"] == broadcast_id), 
            None
        )
        
        if not broadcast:
            return {"success": False, "error": "Broadcast not found"}
        
        if broadcast["status"] not in ["pending", "scheduled"]:
            return {"success": False, "error": "Cannot cancel broadcast in this status"}
        
        broadcast["status"] = "cancelled"
        broadcast["cancelled_at"] = datetime.utcnow()
        
        self._queue.remove(broadcast)
        self._history.append(broadcast)
        
        return {"success": True, "message": "Broadcast cancelled"}

    def get_stats(self) -> dict:
        """Get broadcast statistics"""
        self._check_daily_reset()
        
        return {
            "sent_today": self._sent_today,
            "daily_limit": self.settings.rate_limit_broadcasts_per_day,
            "remaining_today": max(0, self.settings.rate_limit_broadcasts_per_day - self._sent_today),
            "queued": len([b for b in self._queue if b["status"] in ["pending", "processing"]]),
            "scheduled": len([b for b in self._queue if b["status"] == "scheduled"]),
            "total_sent": sum(b.get("sent_count", 0) for b in self._history)
        }
