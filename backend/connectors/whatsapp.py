import aiohttp

from config import get_settings
from connectors.base import BaseConnector


class WhatsAppConnector(BaseConnector):
    connector_type = "whatsapp"

    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.evolution_api_url.rstrip("/")
        self.api_key = settings.evolution_api_key

    async def _request(self, method: str, path: str, payload: dict | None = None) -> dict:
        headers = {"apikey": self.api_key} if self.api_key else {}
        url = f"{self.base_url}{path}"
        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, json=payload, headers=headers) as response:
                data = await response.json(content_type=None)
                return {"status": response.status, "data": data}

    async def connect(self) -> dict:
        return await self._request("POST", "/instance/create", payload={"instanceName": "leblebbot"})

    async def disconnect(self) -> dict:
        return await self._request("DELETE", "/instance/delete/leblebbot")

    async def status(self) -> dict:
        return await self._request("GET", "/instance/status/leblebbot")

    async def send_message(self, to: str, message: str) -> dict:
        payload = {"number": to, "textMessage": {"text": message}}
        return await self._request("POST", "/message/sendText/leblebbot", payload=payload)

    async def handle_webhook(self, payload: dict) -> dict:
        return {"received": True, "payload": payload}
