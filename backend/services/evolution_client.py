"""
Evolution API HTTP Client
Base client with connection pooling and retry logic for Evolution API.
"""

from __future__ import annotations

import asyncio
import logging
from typing import ClassVar, Optional

import aiohttp

from config import get_settings

logger = logging.getLogger(__name__)


class EvolutionClient:
    """
    Base HTTP client for Evolution API with connection pooling.
    Uses a singleton session to reuse connections across requests.
    """
    
    # Class-level session (shared across all instances)
    _session: ClassVar[Optional[aiohttp.ClientSession]] = None
    _connector: ClassVar[Optional[aiohttp.TCPConnector]] = None
    
    def __init__(self, instance_name: Optional[str] = None) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.evolution_api_url.rstrip("/")
        self.api_key = self.settings.evolution_api_key
        self.instance_name = instance_name or self.settings.evolution_instance_name
    
    @classmethod
    async def get_session(cls) -> aiohttp.ClientSession:
        """
        Get or create the shared aiohttp session with connection pooling.
        This reuses TCP connections for better performance.
        """
        if cls._session is None or cls._session.closed:
            cls._connector = aiohttp.TCPConnector(
                limit=100,              # Max total connections
                limit_per_host=30,      # Max connections per host
                keepalive_timeout=30,   # Keep connections alive for 30s
                enable_cleanup_closed=True,
                force_close=False,
            )
            cls._session = aiohttp.ClientSession(
                connector=cls._connector,
                timeout=aiohttp.ClientTimeout(total=30, connect=5),
            )
            logger.info("Created new Evolution API HTTP session with connection pooling")
        return cls._session
    
    @classmethod
    async def close_session(cls) -> None:
        """Close the shared session. Call on application shutdown."""
        if cls._session and not cls._session.closed:
            await cls._session.close()
            cls._session = None
            cls._connector = None
            logger.info("Closed Evolution API HTTP session")
    
    async def _request(
        self,
        method: str,
        path: str,
        payload: Optional[dict] = None,
        timeout: int = 30,
        max_retries: int = 2
    ) -> dict:
        """
        Make HTTP request to Evolution API with connection reuse and retry logic.
        
        Args:
            method: HTTP method (GET, POST, DELETE, etc.)
            path: API path (e.g., "/instance/fetchInstances")
            payload: JSON payload for POST requests
            timeout: Request timeout in seconds
            max_retries: Number of retries for transient errors
            
        Returns:
            dict with success, status, data/error keys
        """
        headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json"
        }
        url = f"{self.base_url}{path}"
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                session = await self.get_session()
                async with session.request(
                    method,
                    url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    data = await response.json(content_type=None)
                    return {
                        "success": response.status in (200, 201),
                        "status": response.status,
                        "data": data
                    }
            
            except asyncio.TimeoutError:
                last_error = "timeout"
                logger.warning(f"Request timeout (attempt {attempt + 1}/{max_retries + 1}): {url}")
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                    
            except aiohttp.ClientError as e:
                last_error = str(e)
                logger.warning(f"Client error (attempt {attempt + 1}/{max_retries + 1}): {e}")
                if attempt < max_retries:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                    
            except Exception as e:
                last_error = str(e)
                logger.error(f"Evolution API request error: {e}")
                break
        
        return {"success": False, "error": last_error}
