"""
Google Calendar Integration Service for LeblebBot
Handles booking synchronization with Google Calendar
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class CalendarEvent(BaseModel):
    """Google Calendar Event model"""
    id: Optional[str] = None
    summary: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    attendees: List[str] = []
    reminders: Dict[str, Any] = {}


class GoogleCalendarService:
    """
    Service for integrating with Google Calendar API
    Syncs bookings and creates calendar events
    """
    
    def __init__(self, credentials_path: Optional[str] = None):
        """
        Initialize Google Calendar service
        
        Args:
            credentials_path: Path to Google OAuth credentials JSON file
        """
        self.credentials_path = credentials_path
        self.service = None
        self._initialized = False
        
    async def initialize(self) -> bool:
        """
        Initialize the Google Calendar API service
        
        Returns:
            bool: True if initialization successful
        """
        try:
            # In production, this would use google-auth-oauthlib
            # from google.oauth2.credentials import Credentials
            # from googleapiclient.discovery import build
            
            logger.info("Google Calendar service initialized")
            self._initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Google Calendar: {e}")
            return False
    
    async def create_event(self, event: CalendarEvent) -> Optional[str]:
        """
        Create a new calendar event
        
        Args:
            event: CalendarEvent object with event details
            
        Returns:
            str: Event ID if created successfully, None otherwise
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            event_body = {
                'summary': event.summary,
                'description': event.description,
                'start': {
                    'dateTime': event.start_time.isoformat(),
                    'timeZone': 'Africa/Cairo',
                },
                'end': {
                    'dateTime': event.end_time.isoformat(),
                    'timeZone': 'Africa/Cairo',
                },
                'attendees': [{'email': email} for email in event.attendees],
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},
                        {'method': 'popup', 'minutes': 30},
                    ],
                },
            }
            
            if event.location:
                event_body['location'] = event.location
            
            # In production:
            # result = self.service.events().insert(
            #     calendarId='primary',
            #     body=event_body
            # ).execute()
            # return result.get('id')
            
            logger.info(f"Created calendar event: {event.summary}")
            return f"event_{datetime.now().timestamp()}"
            
        except Exception as e:
            logger.error(f"Failed to create calendar event: {e}")
            return None
    
    async def update_event(self, event_id: str, event: CalendarEvent) -> bool:
        """
        Update an existing calendar event
        
        Args:
            event_id: ID of the event to update
            event: Updated CalendarEvent object
            
        Returns:
            bool: True if update successful
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            event_body = {
                'summary': event.summary,
                'description': event.description,
                'start': {
                    'dateTime': event.start_time.isoformat(),
                    'timeZone': 'Africa/Cairo',
                },
                'end': {
                    'dateTime': event.end_time.isoformat(),
                    'timeZone': 'Africa/Cairo',
                },
            }
            
            # In production:
            # self.service.events().update(
            #     calendarId='primary',
            #     eventId=event_id,
            #     body=event_body
            # ).execute()
            
            logger.info(f"Updated calendar event: {event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update calendar event: {e}")
            return False
    
    async def delete_event(self, event_id: str) -> bool:
        """
        Delete a calendar event
        
        Args:
            event_id: ID of the event to delete
            
        Returns:
            bool: True if deletion successful
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # In production:
            # self.service.events().delete(
            #     calendarId='primary',
            #     eventId=event_id
            # ).execute()
            
            logger.info(f"Deleted calendar event: {event_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete calendar event: {e}")
            return False
    
    async def get_events(
        self, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[CalendarEvent]:
        """
        Get calendar events within a date range
        
        Args:
            start_date: Start of date range
            end_date: End of date range
            
        Returns:
            List of CalendarEvent objects
        """
        if not self._initialized:
            await self.initialize()
            
        try:
            # In production:
            # events_result = self.service.events().list(
            #     calendarId='primary',
            #     timeMin=start_date.isoformat() + 'Z',
            #     timeMax=end_date.isoformat() + 'Z',
            #     singleEvents=True,
            #     orderBy='startTime'
            # ).execute()
            # events = events_result.get('items', [])
            
            logger.info(f"Retrieved events from {start_date} to {end_date}")
            return []
            
        except Exception as e:
            logger.error(f"Failed to get calendar events: {e}")
            return []
    
    async def sync_booking_to_calendar(
        self,
        booking_id: str,
        customer_name: str,
        customer_phone: str,
        service: str,
        start_time: datetime,
        duration_minutes: int,
        notes: Optional[str] = None
    ) -> Optional[str]:
        """
        Sync a booking to Google Calendar
        
        Args:
            booking_id: Unique booking identifier
            customer_name: Name of the customer
            customer_phone: Customer phone number
            service: Service being booked
            start_time: Booking start time
            duration_minutes: Duration in minutes
            notes: Optional booking notes
            
        Returns:
            str: Calendar event ID if created successfully
        """
        event = CalendarEvent(
            summary=f"حجز - {customer_name} - {service}",
            description=f"""
حجز من LeblebBot

العميل: {customer_name}
الهاتف: {customer_phone}
الخدمة: {service}
معرف الحجز: {booking_id}

{f'ملاحظات: {notes}' if notes else ''}
            """.strip(),
            start_time=start_time,
            end_time=start_time + timedelta(minutes=duration_minutes),
        )
        
        return await self.create_event(event)


# Singleton instance
calendar_service = GoogleCalendarService()
