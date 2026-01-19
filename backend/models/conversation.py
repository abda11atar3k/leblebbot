from datetime import datetime
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    id: str
    user_id: str
    messages: list[Message] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
