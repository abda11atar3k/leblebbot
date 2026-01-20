from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """Base user model"""
    phone: Optional[str] = None
    whatsapp_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


class UserCreate(UserBase):
    """Model for creating a user"""
    pass


class UserUpdate(BaseModel):
    """Model for updating a user"""
    name: Optional[str] = None
    email: Optional[str] = None
    tags: Optional[list[str]] = None
    preferences: Optional[dict[str, Any]] = None
    metadata: Optional[dict[str, Any]] = None


class User(UserBase):
    """Full user model"""
    id: str = Field(alias="_id")
    created_at: datetime
    last_contact: datetime
    first_contact: datetime
    order_count: int = 0
    total_spent: float = 0
    conversation_count: int = 0
    tags: list[str] = []
    preferences: dict[str, Any] = {}
    metadata: dict[str, Any] = {}

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    """User response for API"""
    id: str
    phone: Optional[str]
    name: Optional[str]
    email: Optional[str]
    order_count: int
    total_spent: float
    conversation_count: int
    tags: list[str]
    created_at: datetime
    last_contact: datetime

    @classmethod
    def from_db(cls, user: dict) -> "UserResponse":
        return cls(
            id=user.get("_id", ""),
            phone=user.get("phone"),
            name=user.get("name"),
            email=user.get("email"),
            order_count=user.get("order_count", 0),
            total_spent=user.get("total_spent", 0),
            conversation_count=user.get("conversation_count", 0),
            tags=user.get("tags", []),
            created_at=user.get("created_at", datetime.utcnow()),
            last_contact=user.get("last_contact", datetime.utcnow())
        )
