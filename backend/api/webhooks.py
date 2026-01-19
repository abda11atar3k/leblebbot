from fastapi import APIRouter, Request

from connectors.messenger import MessengerConnector
from connectors.telegram import TelegramConnector
from connectors.whatsapp import WhatsAppConnector


router = APIRouter(prefix="/webhook")


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    connector = WhatsAppConnector()
    return await connector.handle_webhook(payload)


@router.post("/messenger")
async def messenger_webhook(request: Request):
    payload = await request.json()
    connector = MessengerConnector()
    return await connector.handle_webhook(payload)


@router.post("/telegram")
async def telegram_webhook(request: Request):
    payload = await request.json()
    connector = TelegramConnector()
    return await connector.handle_webhook(payload)
