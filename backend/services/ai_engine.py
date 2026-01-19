from __future__ import annotations

import json
from typing import Any

import redis

from config import get_settings


class AIEngine:
    def __init__(self) -> None:
        settings = get_settings()
        self.redis = redis.Redis.from_url(settings.redis_url, decode_responses=True)
        self.model_fast = "llama-3.1-8b"
        self.model_smart = "llama-3.1-70b"

    def _cache_key(self, prompt: str) -> str:
        return f"ai_cache:{hash(prompt)}"

    def generate(self, prompt: str, use_smart: bool = False) -> str:
        cache_key = self._cache_key(prompt)
        cached = self.redis.get(cache_key)
        if cached:
            return cached

        model = self.model_smart if use_smart else self.model_fast
        response = f"[{model}] {prompt}"
        self.redis.setex(cache_key, 300, response)
        return response

    def build_context(self, messages: list[dict[str, Any]]) -> str:
        return json.dumps(messages)
