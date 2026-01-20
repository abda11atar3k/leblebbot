import logging
from typing import Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""

    def __init__(self) -> None:
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict) -> None:
        """Broadcast message to all connected clients."""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        # Remove disconnected
        self.active_connections -= disconnected

    async def send_to_user(self, user_id: str, message: dict) -> None:
        """Send message to specific user (if we track user connections)."""
        # For now, broadcast to all
        await self.broadcast(message)


manager = ConnectionManager()


async def broadcast_event(event_type: str, data: dict) -> None:
    """Helper to broadcast events from other modules."""
    await manager.broadcast({
        "type": event_type,
        "data": data
    })
