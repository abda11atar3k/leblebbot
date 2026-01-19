"""
Google Sheets Integration Service for LeblebBot
Handles data export and analytics logging to Google Sheets
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class SheetData(BaseModel):
    """Model for sheet data row"""
    timestamp: datetime
    data: Dict[str, Any]


class GoogleSheetsService:
    """
    Service for integrating with Google Sheets API
    Exports data and logs analytics
    """
    
    def __init__(self, credentials_path: Optional[str] = None):
        """
        Initialize Google Sheets service
        
        Args:
            credentials_path: Path to Google OAuth credentials JSON file
        """
        self.credentials_path = credentials_path
        self.service = None
        self._initialized = False
        
    async def initialize(self) -> bool:
        """
        Initialize the Google Sheets API service
        
        Returns:
            bool: True if initialization successful
        """
        try:
            # In production, this would use google-auth-oauthlib
            # from google.oauth2.credentials import Credentials
            # from googleapiclient.discovery import build
            
            logger.info("Google Sheets service initialized")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets: {e}")
            return False
    
    async def append_row(
        self, 
        spreadsheet_id: str, 
        sheet_name: str, 
        values: List[Any]
    ) -> bool:
        """
        Append a row to a Google Sheet
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            sheet_name: Name of the sheet tab
            values: List of values for the row
            
        Returns:
            bool: True if append successful
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # In production:
            # range_name = f"{sheet_name}!A:Z"
            # body = {'values': [values]}
            # self.service.spreadsheets().values().append(
            #     spreadsheetId=spreadsheet_id,
            #     range=range_name,
            #     valueInputOption='USER_ENTERED',
            #     body=body
            # ).execute()
            
            logger.info(f"Appended row to sheet: {sheet_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to append row: {e}")
            return False
    
    async def get_rows(
        self, 
        spreadsheet_id: str, 
        sheet_name: str, 
        range_str: str = "A:Z"
    ) -> List[List[Any]]:
        """
        Get rows from a Google Sheet
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            sheet_name: Name of the sheet tab
            range_str: Range of cells to retrieve
            
        Returns:
            List of rows (each row is a list of values)
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # In production:
            # range_name = f"{sheet_name}!{range_str}"
            # result = self.service.spreadsheets().values().get(
            #     spreadsheetId=spreadsheet_id,
            #     range=range_name
            # ).execute()
            # return result.get('values', [])
            
            logger.info(f"Retrieved rows from sheet: {sheet_name}")
            return []
            
        except Exception as e:
            logger.error(f"Failed to get rows: {e}")
            return []
    
    async def log_order(
        self,
        spreadsheet_id: str,
        order_id: str,
        customer_name: str,
        customer_phone: str,
        items: List[Dict[str, Any]],
        total: float,
        status: str,
        platform: str,
        address: str
    ) -> bool:
        """
        Log an order to Google Sheets
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            order_id: Unique order identifier
            customer_name: Name of the customer
            customer_phone: Customer phone number
            items: List of order items
            total: Total order amount
            status: Order status
            platform: Platform (whatsapp, facebook, etc.)
            address: Delivery address
            
        Returns:
            bool: True if logged successfully
        """
        items_str = ", ".join([f"{item['name']} x{item['quantity']}" for item in items])
        
        values = [
            datetime.now().isoformat(),
            order_id,
            customer_name,
            customer_phone,
            items_str,
            total,
            status,
            platform,
            address
        ]
        
        return await self.append_row(spreadsheet_id, "الأوردرات", values)
    
    async def log_booking(
        self,
        spreadsheet_id: str,
        booking_id: str,
        customer_name: str,
        customer_phone: str,
        service: str,
        date: datetime,
        time: str,
        status: str,
        platform: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Log a booking to Google Sheets
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            booking_id: Unique booking identifier
            customer_name: Name of the customer
            customer_phone: Customer phone number
            service: Service being booked
            date: Booking date
            time: Booking time
            status: Booking status
            platform: Platform (whatsapp, facebook, etc.)
            notes: Optional notes
            
        Returns:
            bool: True if logged successfully
        """
        values = [
            datetime.now().isoformat(),
            booking_id,
            customer_name,
            customer_phone,
            service,
            date.strftime("%Y-%m-%d"),
            time,
            status,
            platform,
            notes or ""
        ]
        
        return await self.append_row(spreadsheet_id, "الحجوزات", values)
    
    async def log_conversation(
        self,
        spreadsheet_id: str,
        conversation_id: str,
        customer_name: str,
        customer_phone: str,
        platform: str,
        messages_count: int,
        duration_minutes: int,
        resolved: bool,
        topics: List[str]
    ) -> bool:
        """
        Log a conversation summary to Google Sheets
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            conversation_id: Unique conversation identifier
            customer_name: Name of the customer
            customer_phone: Customer phone number
            platform: Platform (whatsapp, facebook, etc.)
            messages_count: Number of messages in conversation
            duration_minutes: Conversation duration in minutes
            resolved: Whether the conversation was resolved
            topics: List of topics discussed
            
        Returns:
            bool: True if logged successfully
        """
        values = [
            datetime.now().isoformat(),
            conversation_id,
            customer_name,
            customer_phone,
            platform,
            messages_count,
            duration_minutes,
            "نعم" if resolved else "لا",
            ", ".join(topics)
        ]
        
        return await self.append_row(spreadsheet_id, "المحادثات", values)
    
    async def log_analytics(
        self,
        spreadsheet_id: str,
        date: datetime,
        total_conversations: int,
        total_orders: int,
        total_bookings: int,
        revenue: float,
        avg_response_time: float,
        customer_satisfaction: float,
        platform_breakdown: Dict[str, int]
    ) -> bool:
        """
        Log daily analytics to Google Sheets
        
        Args:
            spreadsheet_id: ID of the spreadsheet
            date: Date of analytics
            total_conversations: Total conversations
            total_orders: Total orders
            total_bookings: Total bookings
            revenue: Total revenue
            avg_response_time: Average response time in seconds
            customer_satisfaction: Satisfaction score (0-100)
            platform_breakdown: Dict of platform -> count
            
        Returns:
            bool: True if logged successfully
        """
        values = [
            date.strftime("%Y-%m-%d"),
            total_conversations,
            total_orders,
            total_bookings,
            revenue,
            avg_response_time,
            customer_satisfaction,
            platform_breakdown.get("whatsapp", 0),
            platform_breakdown.get("facebook", 0),
            platform_breakdown.get("instagram", 0)
        ]
        
        return await self.append_row(spreadsheet_id, "التحليلات اليومية", values)
    
    async def create_spreadsheet(self, title: str) -> Optional[str]:
        """
        Create a new Google Spreadsheet with predefined sheets
        
        Args:
            title: Title of the spreadsheet
            
        Returns:
            str: Spreadsheet ID if created successfully
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # In production:
            # spreadsheet = {
            #     'properties': {'title': title},
            #     'sheets': [
            #         {'properties': {'title': 'الأوردرات'}},
            #         {'properties': {'title': 'الحجوزات'}},
            #         {'properties': {'title': 'المحادثات'}},
            #         {'properties': {'title': 'التحليلات اليومية'}},
            #     ]
            # }
            # result = self.service.spreadsheets().create(body=spreadsheet).execute()
            # return result.get('spreadsheetId')
            
            logger.info(f"Created spreadsheet: {title}")
            return f"spreadsheet_{datetime.now().timestamp()}"
            
        except Exception as e:
            logger.error(f"Failed to create spreadsheet: {e}")
            return None


# Singleton instance
sheets_service = GoogleSheetsService()
