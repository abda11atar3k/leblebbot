from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class BotSettings(BaseModel):
    """Bot configuration settings"""
    name: str = "LeblebBot"
    personality: str = "ودود ومحترف"
    dialect: str = "egyptian"  # egyptian, gulf, levantine, standard
    greeting: str = "أهلاً! أنا هنا لمساعدتك 😊"
    fallback_message: str = "مش فاهم، ممكن توضح أكتر؟"
    handoff_message: str = "هحولك لأحد زملائي دلوقتي"
    offline_message: str = "شكراً لتواصلك، هنرد عليك في أقرب وقت"
    typing_simulation: bool = True
    auto_reply: bool = True


class BusinessHours(BaseModel):
    """Business operating hours"""
    enabled: bool = True
    timezone: str = "Africa/Cairo"
    start_hour: int = 9
    end_hour: int = 23
    days: list[int] = [0, 1, 2, 3, 4, 5, 6]  # 0=Monday


class ConnectorConfig(BaseModel):
    """Configuration for a connected channel"""
    type: str  # whatsapp, messenger, telegram, instagram
    enabled: bool = True
    instance_name: Optional[str] = None
    connected: bool = False
    connected_at: Optional[datetime] = None
    phone_number: Optional[str] = None
    page_id: Optional[str] = None
    metadata: dict[str, Any] = {}


class BusinessBase(BaseModel):
    """Base business model"""
    name: str
    owner_email: str


class BusinessCreate(BusinessBase):
    """Model for creating a business"""
    pass


class Business(BusinessBase):
    """Full business model"""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    
    # Settings
    bot_settings: BotSettings = BotSettings()
    business_hours: BusinessHours = BusinessHours()
    
    # Connectors
    connectors: list[ConnectorConfig] = []
    
    # Subscription
    plan: str = "free"  # free, starter, pro, enterprise
    plan_expires_at: Optional[datetime] = None
    
    # Stats
    total_conversations: int = 0
    total_messages: int = 0
    total_users: int = 0
    
    # Team
    team_members: list[str] = []  # User IDs
    
    # Integrations
    integrations: dict[str, Any] = {}
    
    # Metadata
    metadata: dict[str, Any] = {}

    class Config:
        populate_by_name = True


class BusinessResponse(BaseModel):
    """Business response for API"""
    id: str
    name: str
    owner_email: str
    plan: str
    bot_settings: BotSettings
    business_hours: BusinessHours
    connectors: list[ConnectorConfig]
    total_conversations: int
    total_messages: int
    total_users: int
    created_at: datetime

    @classmethod
    def from_db(cls, business: dict) -> "BusinessResponse":
        return cls(
            id=business.get("_id", ""),
            name=business.get("name", ""),
            owner_email=business.get("owner_email", ""),
            plan=business.get("plan", "free"),
            bot_settings=BotSettings(**business.get("bot_settings", {})),
            business_hours=BusinessHours(**business.get("business_hours", {})),
            connectors=[
                ConnectorConfig(**c) 
                for c in business.get("connectors", [])
            ],
            total_conversations=business.get("total_conversations", 0),
            total_messages=business.get("total_messages", 0),
            total_users=business.get("total_users", 0),
            created_at=business.get("created_at", datetime.utcnow())
        )


class KnowledgeItem(BaseModel):
    """Knowledge base item"""
    id: str = Field(alias="_id")
    business_id: str
    content: str
    category: str = "general"  # general, product, policy, faq
    created_at: datetime
    updated_at: datetime
    metadata: dict[str, Any] = {}

    class Config:
        populate_by_name = True


class KnowledgeCreate(BaseModel):
    """Model for creating knowledge item"""
    content: str
    category: str = "general"


class PlatformStat(BaseModel):
    """Statistics for a single platform"""
    total: int = 0
    contacts: int = 0
    chats: int = 0
    connected: bool = False
    today: int = 0


class SyncStatus(BaseModel):
    """Sync status for Evolution API"""
    connected: bool = False
    connection_status: str = "unknown"
    last_sync: Optional[str] = None
    instance_name: Optional[str] = None
    profile_name: Optional[str] = None


class LiveStatsResponse(BaseModel):
    """Real-time statistics for monitor dashboard"""
    total_messages: int = 0
    total_contacts: int = 0
    total_chats: int = 0
    active_conversations: int = 0
    messages_today: int = 0
    platforms: dict[str, dict] = {}
    sync_status: dict = {}
    timestamp: str = ""


class RecentConversationItem(BaseModel):
    """Single conversation item for live monitor"""
    id: str
    phone: str = ""
    name: str = "Unknown"
    last_message: str = ""
    time: str
    platform: str = "whatsapp"
    status: str = "inactive"
    unread: int = 0
    escalated: bool = False


class RecentConversationsResponse(BaseModel):
    """Response for recent conversations endpoint"""
    items: list[RecentConversationItem] = []
    total: int = 0


class AnalyticsResponse(BaseModel):
    """Analytics data response"""
    total_conversations: int = 0
    active_conversations: int = 0
    resolved_conversations: int = 0
    escalated_conversations: int = 0
    resolution_rate: float = 0.0
    
    total_users: int = 0
    active_users_today: int = 0
    new_users_today: int = 0
    
    total_messages: int = 0
    messages_today: int = 0
    
    avg_response_time: float = 0.0
    csat_score: float = 0.0
    
    top_intents: list[dict] = []
    sentiment_distribution: dict[str, int] = {}
    hourly_traffic: list[dict] = []
    
    # Enhanced fields
    platform_stats: dict[str, dict] = {}
    conversations_by_channel: dict[str, int] = {}
    active_by_platform: dict[str, int] = {}
