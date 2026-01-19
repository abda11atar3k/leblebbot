from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserProfile(BaseModel):
    id: str = Field(..., description="User ID")
    email: EmailStr | None = None
    name: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
