from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MessageBase(BaseModel):
    """Base message model"""
    role: str  # "user" or "assistant"
    content: str


class Message(MessageBase):
    """Full message model"""
    id: str = Field(alias="_id")
    conversation_id: str
    timestamp: datetime
    metadata: dict[str, Any] = {}

    class Config:
        populate_by_name = True


class MessageCreate(MessageBase):
    """Model for creating a message"""
    metadata: Optional[dict[str, Any]] = None


class MessageResponse(BaseModel):
    """Message response for API"""
    id: str
    role: str
    content: str
    timestamp: datetime
    metadata: dict[str, Any] = {}

    @classmethod
    def from_db(cls, message: dict) -> "MessageResponse":
        return cls(
            id=message.get("_id", ""),
            role=message.get("role", "user"),
            content=message.get("content", ""),
            timestamp=message.get("timestamp", datetime.utcnow()),
            metadata=message.get("metadata", {})
        )


class ConversationBase(BaseModel):
    """Base conversation model"""
    user_id: str
    channel: str = "whatsapp"


class ConversationCreate(ConversationBase):
    """Model for creating a conversation"""
    pass


class Conversation(ConversationBase):
    """Full conversation model"""
    id: str = Field(alias="_id")
    status: str = "active"  # active, closed
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    message_count: int = 0
    resolved: bool = False
    escalated: bool = False
    escalated_at: Optional[datetime] = None
    escalation_reason: Optional[str] = None
    sentiment: str = "neutral"  # positive, neutral, negative
    tags: list[str] = []
    metadata: dict[str, Any] = {}
    
    # Classification fields
    intent: Optional[str] = None  # sales, support, complaint, inquiry, booking, general
    priority: str = "medium"  # low, medium, high, urgent
    category: Optional[str] = None  # product, shipping, payment, technical, other
    language: str = "ar"  # ar, en

    class Config:
        populate_by_name = True


class ConversationResponse(BaseModel):
    """Conversation response for API"""
    id: str
    user_id: str
    channel: str
    status: str
    message_count: int
    resolved: bool
    escalated: bool
    sentiment: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None
    user: Optional[dict] = None
    
    # Classification fields
    intent: Optional[str] = None
    priority: str = "medium"
    category: Optional[str] = None
    tags: list[str] = []

    @classmethod
    def from_db(cls, conv: dict) -> "ConversationResponse":
        return cls(
            id=conv.get("_id", ""),
            user_id=conv.get("user_id", ""),
            channel=conv.get("channel", "whatsapp"),
            status=conv.get("status", "active"),
            message_count=conv.get("message_count", 0),
            resolved=conv.get("resolved", False),
            escalated=conv.get("escalated", False),
            sentiment=conv.get("sentiment", "neutral"),
            created_at=conv.get("created_at", datetime.utcnow()),
            updated_at=conv.get("updated_at", datetime.utcnow()),
            last_message=conv.get("last_message"),
            user=conv.get("user"),
            intent=conv.get("intent"),
            priority=conv.get("priority", "medium"),
            category=conv.get("category"),
            tags=conv.get("tags", [])
        )


class ConversationWithMessages(ConversationResponse):
    """Conversation with messages for detailed view"""
    messages: list[MessageResponse] = []


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    user_id: Optional[str] = None
    phone: Optional[str] = None
    message: str
    channel: str = "whatsapp"
    message_type: str = "text"
    media_url: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    success: bool
    response: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    intent: Optional[str] = None
    sentiment: Optional[dict] = None
    suggestions: list[str] = []
    actions: list[dict] = []
    needs_handoff: bool = False
    error: Optional[str] = None
