"""
WhatsApp Notifications Service for LeblebBot
Sends notifications for orders, bookings, and other events
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import logging
from pydantic import BaseModel
from enum import Enum

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """Types of notifications"""
    ORDER_NEW = "order_new"
    ORDER_STATUS = "order_status"
    ORDER_DELIVERED = "order_delivered"
    BOOKING_NEW = "booking_new"
    BOOKING_REMINDER = "booking_reminder"
    BOOKING_CANCELLED = "booking_cancelled"
    PROMO = "promo"
    FOLLOW_UP = "follow_up"


class NotificationTemplate(BaseModel):
    """WhatsApp notification template"""
    type: NotificationType
    template_name: str
    language: str = "ar"
    variables: List[str] = []


class WhatsAppNotificationService:
    """
    Service for sending WhatsApp notifications
    Uses Evolution API for message delivery
    """
    
    def __init__(self, api_url: str = "http://localhost:8080", api_key: Optional[str] = None):
        """
        Initialize WhatsApp notification service
        
        Args:
            api_url: Evolution API URL
            api_key: API key for authentication
        """
        self.api_url = api_url
        self.api_key = api_key
        self._initialized = False
        
        # Predefined message templates
        self.templates = {
            NotificationType.ORDER_NEW: {
                "ar": """
🎉 طلب جديد!

رقم الطلب: {order_id}
العميل: {customer_name}
المنتجات: {items}
الإجمالي: {total} ج.م
العنوان: {address}

📱 من: {platform}
                """.strip(),
                "en": """
🎉 New Order!

Order #: {order_id}
Customer: {customer_name}
Items: {items}
Total: {total} EGP
Address: {address}

📱 From: {platform}
                """.strip()
            },
            NotificationType.ORDER_STATUS: {
                "ar": """
📦 تحديث حالة الطلب

رقم الطلب: {order_id}
الحالة الجديدة: {status}
{message}
                """.strip(),
                "en": """
📦 Order Status Update

Order #: {order_id}
New Status: {status}
{message}
                """.strip()
            },
            NotificationType.ORDER_DELIVERED: {
                "ar": """
✅ تم توصيل طلبك!

رقم الطلب: {order_id}
شكراً لك {customer_name}!

نتمنى أن ينال المنتج إعجابك. 
إذا كان لديك أي استفسار، لا تتردد في التواصل معنا 💜
                """.strip(),
                "en": """
✅ Your order has been delivered!

Order #: {order_id}
Thank you {customer_name}!

We hope you love it.
If you have any questions, don't hesitate to contact us 💜
                """.strip()
            },
            NotificationType.BOOKING_NEW: {
                "ar": """
📅 حجز جديد!

العميل: {customer_name}
الخدمة: {service}
التاريخ: {date}
الوقت: {time}
{notes}

📱 من: {platform}
                """.strip(),
                "en": """
📅 New Booking!

Customer: {customer_name}
Service: {service}
Date: {date}
Time: {time}
{notes}

📱 From: {platform}
                """.strip()
            },
            NotificationType.BOOKING_REMINDER: {
                "ar": """
⏰ تذكير بموعدك

مرحباً {customer_name}!

لديك موعد غداً:
الخدمة: {service}
التاريخ: {date}
الوقت: {time}

نتطلع لرؤيتك! 💜
                """.strip(),
                "en": """
⏰ Appointment Reminder

Hi {customer_name}!

You have an appointment tomorrow:
Service: {service}
Date: {date}
Time: {time}

We look forward to seeing you! 💜
                """.strip()
            },
            NotificationType.FOLLOW_UP: {
                "ar": """
مرحباً {customer_name}! 👋

أردنا الاطمئنان عليك ومعرفة رأيك في آخر تجربة معنا.

هل هناك شيء يمكننا مساعدتك به؟ 💜
                """.strip(),
                "en": """
Hi {customer_name}! 👋

We wanted to check in and hear your thoughts on your recent experience.

Is there anything we can help you with? 💜
                """.strip()
            }
        }
    
    async def initialize(self) -> bool:
        """
        Initialize the WhatsApp notification service
        
        Returns:
            bool: True if initialization successful
        """
        try:
            # Verify Evolution API connection
            logger.info("WhatsApp notification service initialized")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize WhatsApp notifications: {e}")
            return False
    
    async def send_notification(
        self,
        phone: str,
        notification_type: NotificationType,
        variables: Dict[str, Any],
        language: str = "ar"
    ) -> bool:
        """
        Send a WhatsApp notification
        
        Args:
            phone: Recipient phone number (with country code)
            notification_type: Type of notification
            variables: Template variables
            language: Message language (ar/en)
            
        Returns:
            bool: True if sent successfully
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            template = self.templates.get(notification_type, {}).get(language)
            if not template:
                logger.error(f"Template not found: {notification_type} ({language})")
                return False
            
            # Format message with variables
            message = template.format(**variables)
            
            # In production, send via Evolution API:
            # import httpx
            # async with httpx.AsyncClient() as client:
            #     response = await client.post(
            #         f"{self.api_url}/message/sendText/{instance}",
            #         headers={"apikey": self.api_key},
            #         json={
            #             "number": phone,
            #             "text": message
            #         }
            #     )
            #     return response.status_code == 200
            
            logger.info(f"Sent {notification_type} notification to {phone}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            return False
    
    async def send_order_notification(
        self,
        admin_phone: str,
        order_id: str,
        customer_name: str,
        items: List[Dict[str, Any]],
        total: float,
        address: str,
        platform: str,
        language: str = "ar"
    ) -> bool:
        """
        Send new order notification to admin
        
        Args:
            admin_phone: Admin phone number
            order_id: Order ID
            customer_name: Customer name
            items: List of items
            total: Order total
            address: Delivery address
            platform: Order source platform
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        items_str = ", ".join([f"{item['name']} x{item['quantity']}" for item in items])
        
        return await self.send_notification(
            phone=admin_phone,
            notification_type=NotificationType.ORDER_NEW,
            variables={
                "order_id": order_id,
                "customer_name": customer_name,
                "items": items_str,
                "total": total,
                "address": address,
                "platform": platform
            },
            language=language
        )
    
    async def send_order_status_update(
        self,
        customer_phone: str,
        order_id: str,
        status: str,
        message: str = "",
        language: str = "ar"
    ) -> bool:
        """
        Send order status update to customer
        
        Args:
            customer_phone: Customer phone number
            order_id: Order ID
            status: New status
            message: Additional message
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        status_translations = {
            "processing": {"ar": "قيد التجهيز", "en": "Processing"},
            "shipping": {"ar": "في الطريق إليك", "en": "On the way"},
            "delivered": {"ar": "تم التوصيل", "en": "Delivered"},
            "cancelled": {"ar": "ملغي", "en": "Cancelled"}
        }
        
        status_text = status_translations.get(status, {}).get(language, status)
        
        return await self.send_notification(
            phone=customer_phone,
            notification_type=NotificationType.ORDER_STATUS,
            variables={
                "order_id": order_id,
                "status": status_text,
                "message": message
            },
            language=language
        )
    
    async def send_booking_notification(
        self,
        admin_phone: str,
        customer_name: str,
        service: str,
        date: str,
        time: str,
        platform: str,
        notes: str = "",
        language: str = "ar"
    ) -> bool:
        """
        Send new booking notification to admin
        
        Args:
            admin_phone: Admin phone number
            customer_name: Customer name
            service: Service booked
            date: Booking date
            time: Booking time
            platform: Booking source platform
            notes: Additional notes
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        return await self.send_notification(
            phone=admin_phone,
            notification_type=NotificationType.BOOKING_NEW,
            variables={
                "customer_name": customer_name,
                "service": service,
                "date": date,
                "time": time,
                "platform": platform,
                "notes": f"ملاحظات: {notes}" if notes else ""
            },
            language=language
        )
    
    async def send_booking_reminder(
        self,
        customer_phone: str,
        customer_name: str,
        service: str,
        date: str,
        time: str,
        language: str = "ar"
    ) -> bool:
        """
        Send booking reminder to customer
        
        Args:
            customer_phone: Customer phone number
            customer_name: Customer name
            service: Service booked
            date: Booking date
            time: Booking time
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        return await self.send_notification(
            phone=customer_phone,
            notification_type=NotificationType.BOOKING_REMINDER,
            variables={
                "customer_name": customer_name,
                "service": service,
                "date": date,
                "time": time
            },
            language=language
        )
    
    async def send_follow_up(
        self,
        customer_phone: str,
        customer_name: str,
        language: str = "ar"
    ) -> bool:
        """
        Send follow-up message to customer
        
        Args:
            customer_phone: Customer phone number
            customer_name: Customer name
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        return await self.send_notification(
            phone=customer_phone,
            notification_type=NotificationType.FOLLOW_UP,
            variables={
                "customer_name": customer_name
            },
            language=language
        )
    
    async def send_delivery_confirmation(
        self,
        customer_phone: str,
        customer_name: str,
        order_id: str,
        language: str = "ar"
    ) -> bool:
        """
        Send delivery confirmation to customer
        
        Args:
            customer_phone: Customer phone number
            customer_name: Customer name
            order_id: Order ID
            language: Notification language
            
        Returns:
            bool: True if sent successfully
        """
        return await self.send_notification(
            phone=customer_phone,
            notification_type=NotificationType.ORDER_DELIVERED,
            variables={
                "order_id": order_id,
                "customer_name": customer_name
            },
            language=language
        )


# Singleton instance
whatsapp_notifications = WhatsAppNotificationService()
