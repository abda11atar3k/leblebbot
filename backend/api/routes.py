from fastapi import APIRouter
from pydantic import BaseModel

from services.conversation import ConversationService


router = APIRouter()
conversation_service = ConversationService()


class ChatRequest(BaseModel):
    user_id: str
    message: str


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/chat")
async def chat(request: ChatRequest):
    return conversation_service.process_message(request.user_id, request.message)


@router.get("/conversations")
async def conversations():
    return {"items": []}


@router.get("/users")
async def users():
    return {"items": []}


@router.get("/analytics")
async def analytics():
    return {"conversations": 0, "csat": 0, "speed": 0, "orders": 0}
