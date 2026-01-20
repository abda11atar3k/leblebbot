from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ===================
    # AI Settings
    # ===================
    groq_api_key: str = ""
    ai_model_fast: str = "llama-3.1-8b-instant"
    ai_model_smart: str = "llama-3.1-70b-versatile"
    ai_temperature: float = 0.7
    ai_max_tokens: int = 500
    
    # ===================
    # Database Settings
    # ===================
    mongodb_uri: str = "mongodb://mongodb:27017/leblebbot"
    mongodb_database: str = "leblebbot"
    redis_url: str = "redis://redis:6379"
    chroma_host: str = "chromadb"
    chroma_port: int = 8000
    
    # ===================
    # Security
    # ===================
    jwt_secret: str = "change-me-in-production"
    api_key: str = ""
    
    # ===================
    # Evolution API (WhatsApp)
    # ===================
    evolution_api_url: str = "http://evolution-api:8080"
    evolution_api_key: str = ""
    evolution_instance_name: str = "leblebbot"
    
    # ===================
    # Bot Settings
    # ===================
    bot_name: str = "LeblebBot"
    bot_personality: str = "ودود ومحترف"
    bot_dialect: str = "egyptian"  # egyptian, gulf, levantine, standard
    typing_simulation: bool = True
    typing_speed: float = 15.0  # chars per second (faster typing)
    min_response_delay: float = 0.5  # seconds (reduced from 2.0)
    max_response_delay: float = 4.0  # seconds (reduced from 8.0)
    
    # ===================
    # Rate Limiting
    # ===================
    rate_limit_messages_per_minute: int = 3
    rate_limit_messages_per_hour: int = 60
    rate_limit_messages_per_day: int = 200
    rate_limit_broadcasts_per_day: int = 50
    
    # ===================
    # Google OAuth Settings
    # ===================
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3002/api/integrations/callback"
    
    # ===================
    # Google Sheets Settings
    # ===================
    google_sheets_spreadsheet_id: str = ""
    google_sheets_auto_log_orders: bool = True
    google_sheets_auto_log_bookings: bool = True
    
    # ===================
    # Google Calendar Settings
    # ===================
    google_calendar_id: str = "primary"
    google_calendar_sync_bookings: bool = True
    google_calendar_send_invites: bool = True
    
    # ===================
    # Email Settings
    # ===================
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    email_from: str = ""
    
    # ===================
    # Payment - Paymob
    # ===================
    paymob_api_key: str = ""
    paymob_integration_id: str = ""
    paymob_iframe_id: str = ""
    paymob_hmac_secret: str = ""
    
    # ===================
    # Payment - Fawry
    # ===================
    fawry_merchant_code: str = ""
    fawry_security_key: str = ""
    
    # ===================
    # Shipping - Bosta
    # ===================
    bosta_api_key: str = ""
    bosta_business_id: str = ""
    
    # ===================
    # WhatsApp Notifications
    # ===================
    whatsapp_admin_phone: str = ""
    whatsapp_notify_orders: bool = True
    whatsapp_notify_bookings: bool = True

    class Config:
        env_file = [".env", "env.example"]
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()
