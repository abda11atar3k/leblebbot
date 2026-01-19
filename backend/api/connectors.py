from fastapi import APIRouter, HTTPException

from connectors.messenger import MessengerConnector
from connectors.telegram import TelegramConnector
from connectors.whatsapp import WhatsAppConnector


router = APIRouter(prefix="/connectors")


def _get_connector(connector_type: str):
    if connector_type == "whatsapp":
        return WhatsAppConnector()
    if connector_type == "messenger":
        return MessengerConnector()
    if connector_type == "telegram":
        return TelegramConnector()
    raise HTTPException(status_code=404, detail="Connector not found")


@router.get("")
async def list_connectors():
    return {"items": ["whatsapp", "messenger", "telegram"]}


@router.post("/{connector_type}/connect")
async def connect(connector_type: str):
    connector = _get_connector(connector_type)
    return await connector.connect()


@router.delete("/{connector_type}/disconnect")
async def disconnect(connector_type: str):
    connector = _get_connector(connector_type)
    return await connector.disconnect()


@router.get("/{connector_type}/status")
async def status(connector_type: str):
    connector = _get_connector(connector_type)
    return await connector.status()
