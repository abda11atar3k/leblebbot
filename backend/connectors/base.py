from abc import ABC, abstractmethod


class BaseConnector(ABC):
    connector_type: str

    @abstractmethod
    async def connect(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def disconnect(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def status(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def send_message(self, to: str, message: str) -> dict:
        raise NotImplementedError

    @abstractmethod
    async def handle_webhook(self, payload: dict) -> dict:
        raise NotImplementedError
