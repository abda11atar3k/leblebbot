from connectors.base import BaseConnector


class MessengerConnector(BaseConnector):
    connector_type = "messenger"

    async def connect(self) -> dict:
        return {"status": "ok", "message": "Messenger connector placeholder"}

    async def disconnect(self) -> dict:
        return {"status": "ok", "message": "Messenger connector placeholder"}

    async def status(self) -> dict:
        return {"status": "disconnected"}

    async def send_message(self, to: str, message: str) -> dict:
        return {"status": "queued", "to": to, "message": message}

    async def handle_webhook(self, payload: dict) -> dict:
        return {"received": True, "payload": payload}
