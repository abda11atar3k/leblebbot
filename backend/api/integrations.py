"""
Integrations API for LeblebBot
Handles connecting, disconnecting, and configuring external services
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/integrations", tags=["integrations"])


# ============= Models =============

class IntegrationStatus(BaseModel):
    """Status of an integration"""
    connected: bool
    last_sync: Optional[str] = None
    error: Optional[str] = None


class IntegrationConfig(BaseModel):
    """Configuration for an integration"""
    enabled: bool = True
    settings: Dict[str, Any] = {}


class Integration(BaseModel):
    """Full integration model"""
    id: str
    name: str
    name_ar: str
    description: str
    description_ar: str
    category: str
    icon: str
    status: IntegrationStatus
    config: IntegrationConfig
    features: List[str]
    features_ar: List[str]


class ConnectRequest(BaseModel):
    """Request to connect an integration"""
    credentials: Optional[Dict[str, str]] = None
    settings: Optional[Dict[str, Any]] = None


class SettingsUpdate(BaseModel):
    """Request to update integration settings"""
    settings: Dict[str, Any]


class TestResult(BaseModel):
    """Result of testing an integration"""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None


# ============= In-Memory Storage (Replace with DB in production) =============

integrations_db: Dict[str, Integration] = {
    "google-sheets": Integration(
        id="google-sheets",
        name="Google Sheets",
        name_ar="جداول بيانات جوجل",
        description="Export orders, bookings, and analytics to Google Sheets automatically",
        description_ar="تصدير الأوردرات والحجوزات والتحليلات لجداول بيانات جوجل تلقائياً",
        category="google",
        icon="FileSpreadsheet",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "spreadsheet_id": "",
            "auto_log_orders": True,
            "auto_log_bookings": True,
            "auto_log_conversations": False,
            "daily_analytics": True
        }),
        features=[
            "Auto-log orders to spreadsheet",
            "Export booking records",
            "Daily analytics reports",
            "Custom data exports"
        ],
        features_ar=[
            "تسجيل الأوردرات تلقائياً",
            "تصدير سجلات الحجوزات",
            "تقارير تحليلية يومية",
            "تصدير بيانات مخصصة"
        ]
    ),
    "google-calendar": Integration(
        id="google-calendar",
        name="Google Calendar",
        name_ar="تقويم جوجل",
        description="Sync bookings automatically with Google Calendar",
        description_ar="مزامنة الحجوزات تلقائياً مع تقويم جوجل",
        category="google",
        icon="Calendar",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "calendar_id": "primary",
            "sync_bookings": True,
            "send_invites": True,
            "reminder_minutes": 30
        }),
        features=[
            "Auto-create calendar events",
            "Two-way sync",
            "Send calendar invites",
            "Set automatic reminders"
        ],
        features_ar=[
            "إنشاء أحداث تلقائياً",
            "مزامنة ثنائية الاتجاه",
            "إرسال دعوات التقويم",
            "تذكيرات تلقائية"
        ]
    ),
    "gmail": Integration(
        id="gmail",
        name="Gmail / Email",
        name_ar="البريد الإلكتروني",
        description="Send email notifications and reports",
        description_ar="إرسال إشعارات وتقارير بالبريد الإلكتروني",
        category="google",
        icon="Mail",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "notify_new_orders": True,
            "notify_new_bookings": True,
            "daily_summary": True,
            "summary_time": "09:00"
        }),
        features=[
            "New order notifications",
            "Booking confirmations",
            "Daily summary reports",
            "Custom email templates"
        ],
        features_ar=[
            "إشعارات الأوردرات الجديدة",
            "تأكيدات الحجوزات",
            "تقارير ملخص يومية",
            "قوالب بريد مخصصة"
        ]
    ),
    "whatsapp-notifications": Integration(
        id="whatsapp-notifications",
        name="WhatsApp Notifications",
        name_ar="إشعارات واتساب",
        description="Send instant notifications via WhatsApp",
        description_ar="إرسال إشعارات فورية عبر واتساب",
        category="messaging",
        icon="MessageSquare",
        status=IntegrationStatus(connected=True, last_sync="منذ دقيقتين"),
        config=IntegrationConfig(settings={
            "admin_phone": "",
            "notify_new_orders": True,
            "notify_new_bookings": True,
            "customer_updates": True
        }),
        features=[
            "Admin order alerts",
            "Customer status updates",
            "Booking reminders",
            "Follow-up messages"
        ],
        features_ar=[
            "تنبيهات الأوردرات للإدارة",
            "تحديثات حالة للعملاء",
            "تذكيرات الحجوزات",
            "رسائل المتابعة"
        ]
    ),
    "paymob": Integration(
        id="paymob",
        name="Paymob",
        name_ar="باي موب",
        description="Accept online payments via Paymob gateway",
        description_ar="قبول المدفوعات أونلاين عبر بوابة باي موب",
        category="payment",
        icon="CreditCard",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "api_key": "",
            "integration_id": "",
            "iframe_id": "",
            "hmac_secret": ""
        }),
        features=[
            "Credit/Debit cards",
            "Mobile wallets",
            "Installments",
            "Automatic reconciliation"
        ],
        features_ar=[
            "بطاقات ائتمان/خصم",
            "المحافظ الإلكترونية",
            "التقسيط",
            "التسوية التلقائية"
        ]
    ),
    "fawry": Integration(
        id="fawry",
        name="Fawry",
        name_ar="فوري",
        description="Accept Fawry payments and cash collection",
        description_ar="قبول مدفوعات فوري والتحصيل النقدي",
        category="payment",
        icon="Banknote",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "merchant_code": "",
            "security_key": ""
        }),
        features=[
            "Fawry reference codes",
            "Cash collection points",
            "Payment tracking",
            "Automatic confirmation"
        ],
        features_ar=[
            "أكواد مرجعية فوري",
            "نقاط تحصيل نقدي",
            "تتبع المدفوعات",
            "تأكيد تلقائي"
        ]
    ),
    "bosta": Integration(
        id="bosta",
        name="Bosta",
        name_ar="بوسطة",
        description="Shipping and delivery with Bosta",
        description_ar="الشحن والتوصيل مع بوسطة",
        category="shipping",
        icon="Truck",
        status=IntegrationStatus(connected=False),
        config=IntegrationConfig(settings={
            "api_key": "",
            "business_id": "",
            "auto_create_shipment": True
        }),
        features=[
            "Auto-create shipments",
            "Real-time tracking",
            "COD support",
            "Delivery notifications"
        ],
        features_ar=[
            "إنشاء شحنات تلقائياً",
            "تتبع لحظي",
            "الدفع عند الاستلام",
            "إشعارات التوصيل"
        ]
    ),
}


# ============= Endpoints =============

@router.get("", response_model=List[Integration])
async def list_integrations(
    category: Optional[str] = Query(None, description="Filter by category")
):
    """
    List all available integrations
    """
    integrations = list(integrations_db.values())
    
    if category:
        integrations = [i for i in integrations if i.category == category]
    
    return integrations


@router.get("/categories")
async def list_categories():
    """
    List all integration categories
    """
    return {
        "categories": [
            {"id": "google", "name": "Google Services", "name_ar": "خدمات جوجل"},
            {"id": "messaging", "name": "Messaging", "name_ar": "الرسائل"},
            {"id": "payment", "name": "Payment Gateways", "name_ar": "بوابات الدفع"},
            {"id": "shipping", "name": "Shipping", "name_ar": "الشحن"},
        ]
    }


@router.get("/{integration_id}", response_model=Integration)
async def get_integration(integration_id: str):
    """
    Get details of a specific integration
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    return integrations_db[integration_id]


@router.post("/{integration_id}/connect")
async def connect_integration(integration_id: str, request: ConnectRequest):
    """
    Connect an integration (initiate OAuth flow or save credentials)
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = integrations_db[integration_id]
    
    # For Google services, return OAuth URL
    if integration.category == "google":
        # In production, this would generate actual OAuth URL
        oauth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/{integration_id.replace('google-', '')}&response_type=code&access_type=offline"
        
        return {
            "status": "oauth_required",
            "oauth_url": oauth_url,
            "message": "Please complete OAuth flow"
        }
    
    # For other services, save credentials and mark as connected
    if request.credentials:
        # In production, encrypt and save credentials
        pass
    
    if request.settings:
        integration.config.settings.update(request.settings)
    
    integration.status.connected = True
    integration.status.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    logger.info(f"Connected integration: {integration_id}")
    
    return {
        "status": "connected",
        "message": f"{integration.name} connected successfully"
    }


@router.get("/{integration_id}/callback")
async def oauth_callback(integration_id: str, code: str, state: Optional[str] = None):
    """
    OAuth callback handler for Google services
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = integrations_db[integration_id]
    
    # In production, exchange code for tokens
    # tokens = google_auth.exchange_code(code)
    # save_tokens(integration_id, tokens)
    
    integration.status.connected = True
    integration.status.last_sync = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    logger.info(f"OAuth completed for: {integration_id}")
    
    return {
        "status": "connected",
        "message": f"{integration.name} connected successfully via OAuth"
    }


@router.post("/{integration_id}/disconnect")
async def disconnect_integration(integration_id: str):
    """
    Disconnect an integration
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = integrations_db[integration_id]
    integration.status.connected = False
    integration.status.last_sync = None
    
    # In production, revoke tokens and delete credentials
    
    logger.info(f"Disconnected integration: {integration_id}")
    
    return {
        "status": "disconnected",
        "message": f"{integration.name} disconnected successfully"
    }


@router.put("/{integration_id}/settings")
async def update_settings(integration_id: str, request: SettingsUpdate):
    """
    Update integration settings
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = integrations_db[integration_id]
    integration.config.settings.update(request.settings)
    
    logger.info(f"Updated settings for: {integration_id}")
    
    return {
        "status": "updated",
        "settings": integration.config.settings
    }


@router.post("/{integration_id}/test", response_model=TestResult)
async def test_integration(integration_id: str):
    """
    Test an integration connection
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = integrations_db[integration_id]
    
    if not integration.status.connected:
        return TestResult(
            success=False,
            message="Integration is not connected"
        )
    
    # In production, actually test the connection
    # For now, simulate success
    
    logger.info(f"Tested integration: {integration_id}")
    
    return TestResult(
        success=True,
        message=f"{integration.name} is working correctly",
        details={"latency_ms": 45, "last_sync": integration.status.last_sync}
    )


@router.get("/{integration_id}/logs")
async def get_integration_logs(
    integration_id: str,
    limit: int = Query(50, le=100)
):
    """
    Get recent activity logs for an integration
    """
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    # In production, fetch from database
    # For now, return mock data
    
    return {
        "logs": [
            {"timestamp": "2024-01-19 10:30:00", "action": "sync", "status": "success", "details": "Synced 5 orders"},
            {"timestamp": "2024-01-19 10:00:00", "action": "sync", "status": "success", "details": "Synced 3 bookings"},
            {"timestamp": "2024-01-19 09:30:00", "action": "connect", "status": "success", "details": "Integration connected"},
        ]
    }
