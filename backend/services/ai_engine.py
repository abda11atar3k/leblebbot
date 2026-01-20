from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Optional

import redis
from groq import Groq

from config import get_settings

logger = logging.getLogger(__name__)


class AIEngine:
    """
    AI Engine with Groq integration, model routing, and semantic caching.
    """

    # Intent categories for routing
    FAST_INTENTS = ["greeting", "faq", "simple_question", "price_inquiry", "thanks"]
    SMART_INTENTS = ["negotiation", "complaint", "complex", "sales", "support", "booking"]

    def __init__(self) -> None:
        self.settings = get_settings()
        self.redis = redis.Redis.from_url(
            self.settings.redis_url, 
            decode_responses=True
        )
        self.groq_client = None
        if self.settings.groq_api_key:
            self.groq_client = Groq(api_key=self.settings.groq_api_key)
        
        self.model_fast = self.settings.ai_model_fast
        self.model_smart = self.settings.ai_model_smart

    def _cache_key(self, text: str) -> str:
        """Generate cache key from text hash"""
        hash_val = hashlib.md5(text.encode()).hexdigest()
        return f"ai_cache:{hash_val}"

    def _get_cached_response(self, prompt: str) -> Optional[str]:
        """Check if response is cached"""
        try:
            cache_key = self._cache_key(prompt)
            cached = self.redis.get(cache_key)
            if cached:
                logger.info("Cache hit for prompt")
                return cached
        except Exception as e:
            logger.warning(f"Redis cache error: {e}")
        return None

    def _cache_response(self, prompt: str, response: str, ttl: int = 3600) -> None:
        """Cache response for future use"""
        try:
            cache_key = self._cache_key(prompt)
            self.redis.setex(cache_key, ttl, response)
        except Exception as e:
            logger.warning(f"Redis cache set error: {e}")

    async def classify_intent(self, message: str) -> dict:
        """
        Classify message intent for routing decisions.
        Returns intent and confidence score.
        """
        if not self.groq_client:
            return {"intent": "unknown", "confidence": 0.5}

        classification_prompt = f"""صنّف الرسالة التالية إلى واحدة من الفئات:
- greeting: تحية أو سلام
- faq: سؤال عام
- price_inquiry: سؤال عن السعر
- simple_question: سؤال بسيط
- thanks: شكر
- negotiation: تفاوض على السعر
- complaint: شكوى
- complex: سؤال معقد
- sales: نية شراء
- support: طلب دعم
- booking: حجز موعد
- unknown: غير واضح

الرسالة: "{message}"

رد بـ JSON فقط بدون أي نص إضافي:
{{"intent": "...", "confidence": 0.0-1.0}}"""

        try:
            response = await self._generate_raw(
                classification_prompt, 
                model=self.model_fast,
                max_tokens=100
            )
            # Parse JSON from response
            result = json.loads(response.strip())
            return result
        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            return {"intent": "unknown", "confidence": 0.5}

    def _select_model(self, intent: str, confidence: float) -> str:
        """Select appropriate model based on intent"""
        # Low confidence = use smart model
        if confidence < 0.7:
            return self.model_smart
        
        # Route based on intent
        if intent in self.FAST_INTENTS:
            return self.model_fast
        elif intent in self.SMART_INTENTS:
            return self.model_smart
        else:
            return self.model_fast  # Default to fast

    async def _generate_raw(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """Generate raw completion from Groq"""
        if not self.groq_client:
            return f"[AI not configured] {prompt[:100]}"

        model = model or self.model_fast
        max_tokens = max_tokens or self.settings.ai_max_tokens

        try:
            response = self.groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.settings.ai_temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return f"عذراً، حدث خطأ. حاول مرة أخرى."

    async def generate(
        self, 
        message: str, 
        context: dict,
        use_cache: bool = True
    ) -> dict:
        """
        Generate AI response with context.
        Returns response and metadata.
        """
        # Build full prompt
        system_prompt = self._build_system_prompt(context)
        conversation_history = self._format_history(context.get("history", []))
        
        full_prompt = f"{system_prompt}\n\n{conversation_history}\nالعميل: {message}\nالمساعد:"

        # Check cache
        if use_cache:
            cached = self._get_cached_response(full_prompt)
            if cached:
                return {
                    "response": cached,
                    "model": "cache",
                    "cached": True
                }

        # Classify intent for routing
        intent_result = await self.classify_intent(message)
        intent = intent_result.get("intent", "unknown")
        confidence = intent_result.get("confidence", 0.5)

        # Select model
        model = self._select_model(intent, confidence)

        # Generate response
        response = await self._generate_raw(full_prompt, model=model)

        # Cache response
        if use_cache and response:
            self._cache_response(full_prompt, response)

        return {
            "response": response,
            "model": model,
            "intent": intent,
            "confidence": confidence,
            "cached": False
        }

    def _build_system_prompt(self, context: dict) -> str:
        """Build system prompt with business context"""
        business = context.get("business", {})
        user = context.get("user", {})
        knowledge = context.get("knowledge", [])

        bot_name = business.get("bot_name", self.settings.bot_name)
        personality = business.get("personality", self.settings.bot_personality)
        
        dialect_map = {
            "egyptian": "المصرية",
            "gulf": "الخليجية",
            "levantine": "الشامية",
            "standard": "الفصحى"
        }
        dialect = dialect_map.get(
            business.get("dialect", self.settings.bot_dialect), 
            "المصرية"
        )

        knowledge_text = ""
        if knowledge:
            knowledge_text = "\n\nالمعلومات المتاحة:\n" + "\n".join(
                f"- {k}" for k in knowledge[:5]
            )

        user_info = ""
        if user:
            user_info = f"""
معلومات العميل:
- الاسم: {user.get('name', 'غير معروف')}
- عدد الطلبات: {user.get('order_count', 0)}
- إجمالي المشتريات: {user.get('total_spent', 0)} جنيه
"""

        return f"""أنت {bot_name} - مساعد خدمة عملاء ذكي.

الشخصية: {personality}
اللهجة: {dialect}

قواعد مهمة:
1. ردودك قصيرة ومفيدة (جملة أو جملتين)
2. لا تكرر نفسك
3. لا تخترع معلومات - لو مش متأكد قول "خليني أتأكد"
4. لو العميل زعلان، اعتذر واعرض المساعدة
5. استخدم إيموجي باعتدال 😊
6. لو فيه فرصة بيع، اقترح بدون إلحاح
{user_info}{knowledge_text}"""

    def _format_history(self, history: list) -> str:
        """Format conversation history for context"""
        if not history:
            return ""
        
        formatted = []
        for msg in history[-10:]:  # Last 10 messages
            role = "العميل" if msg.get("role") == "user" else "المساعد"
            content = msg.get("content", "")
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)

    async def detect_sentiment(self, message: str) -> dict:
        """Detect sentiment from message"""
        if not self.groq_client:
            return {"sentiment": "neutral", "score": 0.5}

        prompt = f"""حلل مشاعر الرسالة التالية:
"{message}"

رد بـ JSON فقط:
{{"sentiment": "positive/negative/neutral", "score": 0.0-1.0, "emotions": ["happy", "angry", "frustrated", "satisfied"]}}"""

        try:
            response = await self._generate_raw(prompt, model=self.model_fast, max_tokens=100)
            return json.loads(response.strip())
        except:
            return {"sentiment": "neutral", "score": 0.5, "emotions": []}

    async def extract_entities(self, message: str) -> dict:
        """Extract entities from message (products, prices, dates, etc.)"""
        if not self.groq_client:
            return {"entities": []}

        prompt = f"""استخرج الكيانات من الرسالة:
"{message}"

رد بـ JSON:
{{"entities": [{{"type": "product/price/date/phone/address", "value": "...", "original": "..."}}]}}"""

        try:
            response = await self._generate_raw(prompt, model=self.model_fast, max_tokens=200)
            return json.loads(response.strip())
        except:
            return {"entities": []}

    async def suggest_responses(self, message: str, context: dict) -> list:
        """Generate quick response suggestions"""
        if not self.groq_client:
            return []

        prompt = f"""بناءً على رسالة العميل، اقترح 3 ردود سريعة قصيرة (كل رد أقل من 10 كلمات):
الرسالة: "{message}"

رد بـ JSON:
{{"suggestions": ["رد 1", "رد 2", "رد 3"]}}"""

        try:
            response = await self._generate_raw(prompt, model=self.model_fast, max_tokens=150)
            result = json.loads(response.strip())
            return result.get("suggestions", [])
        except:
            return ["هشوف ده ليك", "هحولك لمتخصص", "في حاجة تانية أساعدك فيها؟"]
