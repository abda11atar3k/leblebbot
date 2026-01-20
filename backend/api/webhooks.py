import logging
from typing import Optional

from fastapi import APIRouter, Request, BackgroundTasks, HTTPException

from connectors.whatsapp import WhatsAppConnector
from connectors.messenger import MessengerConnector
from connectors.telegram import TelegramConnector
from services.conversation import ConversationService
from services.safety_service import SafetyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook")

# Initialize services
conversation_service = ConversationService()
safety_service = SafetyService()

# Connector instances
whatsapp_connector = WhatsAppConnector()


async def process_whatsapp_message(
    sender: str,
    content: str,
    message_type: str = "text",
    media_url: Optional[str] = None
):
    """
    Background task to process WhatsApp message and send response.
    """
    try:
        logger.info(f"Processing message from {sender}: {content[:50]}...")
        
        # Sanitize input
        content = safety_service.sanitize_user_input(content)
        
        # Build user identifier
        identifier = {
            "phone": sender,
            "whatsapp_id": sender
        }
        
        # Process through conversation service
        result = await conversation_service.process_message(
            user_identifier=identifier,
            message=content,
            channel="whatsapp",
            message_type=message_type,
            media_url=media_url
        )
        
        if result.get("success") and result.get("response"):
            # Send response via WhatsApp
            await whatsapp_connector.send_message(
                to=sender,
                message=result["response"],
                simulate_typing=True,
                vary_message=True
            )
            
            logger.info(f"Response sent to {sender}")
        else:
            logger.warning(f"No response generated for {sender}")
            
    except Exception as e:
        logger.error(f"Error processing WhatsApp message: {e}")
        # Send error message
        try:
            await whatsapp_connector.send_message(
                to=sender,
                message="عذراً، حدث خطأ. حاول مرة أخرى.",
                simulate_typing=False
            )
        except:
            pass


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle incoming WhatsApp webhook from Evolution API.
    """
    try:
        payload = await request.json()
        
        # Log webhook event
        event = payload.get("event")
        logger.info(f"WhatsApp webhook received: {event}")
        
        # Handle different event types
        if event == "messages.upsert":
            # Process incoming message
            result = await whatsapp_connector.handle_webhook(payload)
            
            if result.get("processed") and result.get("content"):
                # Add to background tasks for async processing
                background_tasks.add_task(
                    process_whatsapp_message,
                    sender=result["sender"],
                    content=result["content"],
                    message_type=result.get("message_type", "text"),
                    media_url=result.get("media_url")
                )
                
                return {"status": "processing", "sender": result["sender"]}
            
            return {"status": "skipped", "reason": result.get("reason")}
        
        elif event == "connection.update":
            # Connection status changed
            data = payload.get("data", {})
            state = data.get("state")
            logger.info(f"WhatsApp connection state: {state}")
            return {"status": "ok", "state": state}
        
        elif event == "qrcode.updated":
            # QR code updated
            logger.info("WhatsApp QR code updated")
            return {"status": "ok", "qr_updated": True}
        
        else:
            # Unknown event
            return {"status": "ignored", "event": event}
            
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/whatsapp")
async def whatsapp_webhook_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    """
    Webhook verification for WhatsApp (if needed).
    """
    # Return challenge for verification
    if hub_challenge:
        return int(hub_challenge)
    return {"status": "ok"}


@router.post("/messenger")
async def messenger_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle incoming Messenger webhook.
    """
    try:
        payload = await request.json()
        logger.info(f"Messenger webhook received")
        
        connector = MessengerConnector()
        result = await connector.handle_webhook(payload)
        
        if result.get("processed") and result.get("content"):
            # TODO: Process messenger message similar to WhatsApp
            pass
        
        return result
        
    except Exception as e:
        logger.error(f"Messenger webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/messenger")
async def messenger_webhook_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    """
    Webhook verification for Messenger.
    """
    if hub_mode == "subscribe" and hub_challenge:
        # TODO: Verify token
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/telegram")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle incoming Telegram webhook.
    """
    try:
        payload = await request.json()
        logger.info(f"Telegram webhook received")
        
        connector = TelegramConnector()
        result = await connector.handle_webhook(payload)
        
        if result.get("processed") and result.get("content"):
            # TODO: Process telegram message similar to WhatsApp
            pass
        
        return result
        
    except Exception as e:
        logger.error(f"Telegram webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/evolution")
async def evolution_global_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Global webhook endpoint for Evolution API.
    Routes to appropriate handler based on instance.
    """
    try:
        payload = await request.json()
        instance = payload.get("instance")
        event = payload.get("event")
        
        logger.info(f"Evolution webhook: {event} for {instance}")
        
        # Route to WhatsApp handler
        if event in ["messages.upsert", "connection.update", "qrcode.updated"]:
            return await whatsapp_webhook(request, background_tasks)
        
        return {"status": "ignored", "event": event}
        
    except Exception as e:
        logger.error(f"Evolution webhook error: {e}")
        return {"status": "error", "message": str(e)}
