from collections import defaultdict


class MemoryService:
    def __init__(self) -> None:
        self._memory: dict[str, list[dict]] = defaultdict(list)

    def append(self, user_id: str, message: dict) -> None:
        self._memory[user_id].append(message)

    def get_recent(self, user_id: str, limit: int = 10) -> list[dict]:
        return self._memory.get(user_id, [])[-limit:]
