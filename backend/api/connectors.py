import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from connectors.whatsapp import WhatsAppConnector
from connectors.messenger import MessengerConnector
from connectors.telegram import TelegramConnector
from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connectors")


# Connector instances cache
_connectors = {}


def _get_connector(connector_type: str, instance_name: Optional[str] = None):
    """Get or create connector instance"""
    cache_key = f"{connector_type}:{instance_name or 'default'}"
    
    if cache_key not in _connectors:
        if connector_type == "whatsapp":
            _connectors[cache_key] = WhatsAppConnector(instance_name)
        elif connector_type == "messenger":
            _connectors[cache_key] = MessengerConnector()
        elif connector_type == "telegram":
            _connectors[cache_key] = TelegramConnector()
        else:
            raise HTTPException(status_code=404, detail="Connector not found")
    
    return _connectors[cache_key]


class ConnectorInfo(BaseModel):
    """Connector information response"""
    type: str
    name: str
    description: str
    status: str
    features: list[str]


class SendMessageRequest(BaseModel):
    """Request to send a message"""
    to: str
    message: str
    simulate_typing: bool = True


@router.get("")
async def list_connectors():
    """List all available connectors with their status"""
    connectors = [
        ConnectorInfo(
            type="whatsapp",
            name="WhatsApp",
            description="Connect via WhatsApp Business",
            status="ready",
            features=["text", "image", "audio", "document", "buttons", "list"]
        ),
        ConnectorInfo(
            type="messenger",
            name="Facebook Messenger",
            description="Connect via Facebook Page",
            status="coming_soon",
            features=["text", "image", "buttons"]
        ),
        ConnectorInfo(
            type="telegram",
            name="Telegram",
            description="Connect via Telegram Bot",
            status="coming_soon",
            features=["text", "image", "buttons", "inline"]
        ),
        ConnectorInfo(
            type="instagram",
            name="Instagram DM",
            description="Connect via Instagram Business",
            status="coming_soon",
            features=["text", "image"]
        ),
    ]
    
    return {"items": [c.dict() for c in connectors]}


@router.get("/{connector_type}/status")
async def get_status(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Get connector connection status"""
    connector = _get_connector(connector_type, instance_name)
    return await connector.status()


@router.post("/{connector_type}/connect")
async def connect(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Initialize connection to connector"""
    connector = _get_connector(connector_type, instance_name)
    return await connector.connect()


@router.delete("/{connector_type}/disconnect")
async def disconnect(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Disconnect from connector - deletes instance completely for fresh start"""
    connector = _get_connector(connector_type, instance_name)
    
    # For WhatsApp, use logout() which does logout + delete instance
    if connector_type == "whatsapp":
        result = await connector.logout()
        # Clear all WhatsApp caches
        from api.routes import clear_all_whatsapp_cache
        clear_all_whatsapp_cache()
    else:
        result = await connector.disconnect()
    
    return result


@router.get("/{connector_type}/qr")
async def get_qr_code(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Get QR code for WhatsApp connection"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400, 
            detail="QR code only available for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    return await connector.get_qr_code()


@router.post("/{connector_type}/logout")
async def logout(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Logout from WhatsApp (keep instance)"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400, 
            detail="Logout only available for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    result = await connector.logout()
    
    # Clear all WhatsApp caches when logging out
    from api.routes import clear_all_whatsapp_cache
    clear_all_whatsapp_cache()
    
    return result


@router.post("/{connector_type}/clear-cache")
async def clear_cache(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Clear all caches for the connector"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400, 
            detail="Cache clearing only available for WhatsApp"
        )
    
    from api.routes import clear_all_whatsapp_cache
    return clear_all_whatsapp_cache()


@router.post("/{connector_type}/send")
async def send_message(
    connector_type: str,
    request: SendMessageRequest,
    instance_name: Optional[str] = Query(None)
):
    """Send a message through connector"""
    connector = _get_connector(connector_type, instance_name)
    
    return await connector.send_message(
        to=request.to,
        message=request.message,
        simulate_typing=request.simulate_typing
    )


@router.post("/{connector_type}/send-image")
async def send_image(
    connector_type: str,
    to: str,
    image_url: str,
    caption: str = "",
    instance_name: Optional[str] = Query(None)
):
    """Send an image through connector"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400, 
            detail="Image sending only implemented for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    return await connector.send_image(to, image_url, caption)


@router.get("/{connector_type}/instances")
async def list_instances(connector_type: str):
    """List all instances for a connector (WhatsApp only)"""
    if connector_type != "whatsapp":
        return {"items": []}
    
    connector = _get_connector(connector_type)
    return await connector.get_instance_info()


@router.get("/{connector_type}/sync-status")
async def get_sync_status(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Get sync status with contacts/chats/messages counts (WhatsApp only)"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400,
            detail="Sync status only available for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    return await connector.get_sync_status()


@router.post("/{connector_type}/setup-webhook")
async def setup_webhook(
    connector_type: str,
    webhook_url: str = Query(..., description="Your server's webhook URL (e.g., https://yourdomain.com/webhook/evolution)"),
    instance_name: Optional[str] = Query(None)
):
    """
    Configure Evolution API webhook to receive messages.
    This is REQUIRED to receive incoming WhatsApp messages.
    
    Example webhook_url: https://yourdomain.com/webhook/evolution
    """
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400,
            detail="Webhook setup only available for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    
    # Configure webhook in Evolution API
    payload = {
        "webhook": {
            "enabled": True,
            "url": webhook_url,
            "webhookByEvents": False,
            "webhookBase64": False,
            "events": [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE", 
                "MESSAGES_DELETE",
                "SEND_MESSAGE",
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED",
                "PRESENCE_UPDATE"
            ]
        }
    }
    
    result = await connector._request(
        "POST",
        f"/webhook/set/{connector.instance_name}",
        payload
    )
    
    if result.get("success"):
        logger.info(f"Webhook configured: {webhook_url}")
        return {
            "success": True,
            "message": f"Webhook configured successfully",
            "webhook_url": webhook_url,
            "events": payload["webhook"]["events"]
        }
    else:
        logger.error(f"Failed to configure webhook: {result}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to configure webhook: {result.get('error', 'Unknown error')}"
        )


@router.get("/{connector_type}/webhook-status")
async def get_webhook_status(
    connector_type: str,
    instance_name: Optional[str] = Query(None)
):
    """Check current webhook configuration"""
    if connector_type != "whatsapp":
        raise HTTPException(
            status_code=400,
            detail="Webhook status only available for WhatsApp"
        )
    
    connector = _get_connector(connector_type, instance_name)
    
    result = await connector._request(
        "GET",
        f"/webhook/find/{connector.instance_name}"
    )
    
    if result.get("success"):
        data = result.get("data", {})
        webhook_info = data.get("webhook") if isinstance(data, dict) else data
        return {
            "success": True,
            "webhook": webhook_info
        }
    else:
        return {
            "success": False,
            "message": "No webhook configured",
            "error": result.get("error")
        }
