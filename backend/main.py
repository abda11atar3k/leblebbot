import logging
from contextlib import asynccontextmanager
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.webhooks import router as webhook_router
from api.connectors import router as connector_router
from api.integrations import router as integrations_router
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.add(connection)
        
        # Remove disconnected
        self.active_connections -= disconnected
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to specific user (if we track user connections)"""
        # For now, broadcast to all
        await self.broadcast(message)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting LeblebBot API...")
    settings = get_settings()
    
    # Log configuration (without secrets)
    logger.info(f"MongoDB: {settings.mongodb_uri.split('@')[-1] if '@' in settings.mongodb_uri else settings.mongodb_uri}")
    logger.info(f"Redis: {settings.redis_url}")
    logger.info(f"Evolution API: {settings.evolution_api_url}")
    logger.info(f"Groq configured: {bool(settings.groq_api_key)}")
    
    # Initialize indexes
    try:
        from services.memory_service import MemoryService
        memory = MemoryService()
        
        # Create indexes
        await memory.users.create_index("phone")
        await memory.users.create_index("whatsapp_id")
        await memory.users.create_index("email")
        await memory.conversations.create_index("user_id")
        await memory.conversations.create_index("status")
        await memory.messages.create_index("conversation_id")
        await memory.messages.create_index("timestamp")
        
        logger.info("MongoDB indexes created")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")
    
    logger.info("LeblebBot API started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down LeblebBot API...")
    
    # Close WebSocket connections
    for connection in manager.active_connections.copy():
        try:
            await connection.close()
        except:
            pass
    
    logger.info("LeblebBot API shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="LeblebBot API",
    description="AI-powered customer support chatbot API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)
app.include_router(webhook_router)
app.include_router(connector_router)
app.include_router(integrations_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "leblebbot",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.
    
    Events:
    - new_message: New message received
    - new_conversation: New conversation started
    - conversation_updated: Conversation status changed
    - connection_status: Connector connection changed
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connected successfully"
        })
        
        # Keep connection alive and listen for client messages
        while True:
            data = await websocket.receive_json()
            
            # Handle client messages
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif data.get("type") == "subscribe":
                # Subscribe to specific events
                # For now, all clients receive all events
                await websocket.send_json({
                    "type": "subscribed",
                    "events": data.get("events", ["all"])
                })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


@app.websocket("/ws/{user_id}")
async def user_websocket(websocket: WebSocket, user_id: str):
    """
    User-specific WebSocket for dashboard updates.
    """
    await manager.connect(websocket)
    
    try:
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id
        })
        
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"User WebSocket error: {e}")
        manager.disconnect(websocket)


# Export manager for use in other modules
def get_ws_manager() -> ConnectionManager:
    return manager


# Broadcast helper function
async def broadcast_event(event_type: str, data: dict):
    """Helper to broadcast events from other modules"""
    await manager.broadcast({
        "type": event_type,
        "data": data
    })
