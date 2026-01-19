class BroadcastService:
    def __init__(self) -> None:
        self.queue: list[dict] = []

    def enqueue(self, payload: dict) -> dict:
        self.queue.append(payload)
        return {"status": "queued", "count": len(self.queue)}
