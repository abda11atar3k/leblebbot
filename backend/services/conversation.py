from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Optional

from services.ai_engine import AIEngine
from services.memory_service import MemoryService
from services.safety_service import SafetyService
from config import get_settings

logger = logging.getLogger(__name__)


class ConversationService:
    """
    Main conversation processing pipeline.
    Handles message flow from input to response.
    """

    # Keywords for human handoff
    HANDOFF_KEYWORDS = [
        "موظف", "مدير", "إنسان", "حقيقي", "مسؤول", "شكوى رسمية",
        "تعويض", "قانوني", "محامي", "بشري"
    ]

    # Keywords indicating high urgency
    URGENT_KEYWORDS = [
        "مستعجل", "ضروري", "فوري", "الآن", "حالاً", "طوارئ"
    ]
    
    # Intent classification keywords
    INTENT_KEYWORDS = {
        "sales": ["شراء", "اشتري", "سعر", "كام", "بكام", "عرض", "خصم", "طلب", "اطلب", "عايز"],
        "support": ["مساعدة", "مشكلة", "ازاي", "شرح", "مش فاهم", "مش شغال"],
        "complaint": ["شكوى", "زعلان", "غاضب", "مش راضي", "استرجاع", "استبدال", "تالف"],
        "inquiry": ["استفسار", "سؤال", "إيه", "ايه", "هل", "ممكن", "معلومات"],
        "booking": ["حجز", "موعد", "ميعاد", "احجز", "متاح", "وقت"]
    }
    
    # Category classification keywords
    CATEGORY_KEYWORDS = {
        "product": ["منتج", "بضاعة", "سلعة", "صنف", "موديل", "نوع"],
        "shipping": ["شحن", "توصيل", "تتبع", "وصل", "الطلب فين", "متأخر"],
        "payment": ["دفع", "فلوس", "فيزا", "كاش", "تحويل", "فاتورة"],
        "technical": ["مش شغال", "مش بيفتح", "error", "خطأ", "تقني"]
    }

    def __init__(self) -> None:
        self.settings = get_settings()
        self.ai_engine = AIEngine()
        self.memory = MemoryService()
        self.safety = SafetyService()

    async def process_message(
        self, 
        user_identifier: dict,
        message: str,
        channel: str = "whatsapp",
        message_type: str = "text",
        media_url: Optional[str] = None
    ) -> dict:
        """
        Process incoming message and generate response.
        
        Args:
            user_identifier: Dict with phone, whatsapp_id, email, etc.
            message: The message content
            channel: whatsapp, messenger, telegram, etc.
            message_type: text, voice, image
            media_url: URL for voice/image messages
            
        Returns:
            Dict with response and metadata
        """
        try:
            # Step 1: Get or create user
            user = await self.memory.get_or_create_user(user_identifier)
            user_id = user["_id"]
            
            # Step 2: Get or create conversation
            conversation = await self.memory.get_or_create_conversation(user_id, channel)
            conversation_id = conversation["_id"]
            
            # Step 3: Process media if needed
            if message_type == "voice" and media_url:
                # TODO: Transcribe voice with Whisper
                message = f"[Voice message: {media_url}]"
            elif message_type == "image" and media_url:
                # TODO: Analyze image with Vision
                message = f"[Image: {media_url}]"
            
            # Step 4: Save user message (non-blocking)
            await self.memory.append_message(
                conversation_id=conversation_id,
                role="user",
                content=message,
                metadata={"type": message_type, "media_url": media_url}
            )
            
            # Step 5: Check for human handoff (fast - keyword matching only)
            needs_handoff, handoff_reason = self._check_handoff_needed(message, user)
            if needs_handoff:
                return await self._handle_handoff(
                    user=user,
                    conversation_id=conversation_id,
                    message=message,
                    reason=handoff_reason
                )
            
            # Step 6: Build context (fast - uses cached knowledge)
            context = await self._build_context(user, conversation_id, message)
            
            # Step 7: Generate AI response (single AI call - main one)
            ai_result = await self.ai_engine.generate(message, context)
            response = ai_result["response"]
            
            # Step 8: Validate response safety (fast - regex based)
            safe_response = await self.safety.validate_response(response, context)
            
            # Step 9: Fast local classification (no AI call)
            classification = self._classify_message(message)
            actions = self._extract_actions_fast(message, classification)
            
            # Step 10: Save assistant response
            await self.memory.append_message(
                conversation_id=conversation_id,
                role="assistant",
                content=safe_response,
                metadata={
                    "model": ai_result.get("model"),
                    "intent": ai_result.get("intent"),
                    "cached": ai_result.get("cached", False)
                }
            )
            
            # Step 11: Update conversation (background - non-critical)
            priority = self._determine_priority(message, {"sentiment": "neutral"}, user)
            
            await self.memory.conversations.update_one(
                {"_id": conversation_id},
                {"$set": {
                    "intent": classification.get("intent"),
                    "category": classification.get("category"),
                    "priority": priority
                }}
            )
            
            return {
                "success": True,
                "response": safe_response,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "intent": ai_result.get("intent"),
                "actions": actions,
                "model": ai_result.get("model"),
                "cached": ai_result.get("cached", False),
                "needs_handoff": False
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "success": False,
                "response": "عذراً، حدث خطأ. حاول مرة أخرى.",
                "error": str(e),
                "needs_handoff": True
            }

    def _check_handoff_needed(self, message: str, user: dict) -> tuple[bool, str]:
        """Check if message needs human handoff"""
        message_lower = message.lower()
        
        # Check for explicit handoff request
        for keyword in self.HANDOFF_KEYWORDS:
            if keyword in message_lower:
                return True, f"User requested human: '{keyword}'"
        
        # Check for VIP user with complaint
        if user.get("tags") and "vip" in user.get("tags", []):
            complaint_words = ["مشكلة", "شكوى", "زعلان", "غاضب"]
            for word in complaint_words:
                if word in message_lower:
                    return True, "VIP customer with complaint"
        
        return False, ""
    
    def _classify_message(self, message: str) -> dict:
        """Classify message intent and category"""
        message_lower = message.lower()
        
        # Detect intent
        detected_intent = "general"
        max_matches = 0
        
        for intent, keywords in self.INTENT_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in message_lower)
            if matches > max_matches:
                max_matches = matches
                detected_intent = intent
        
        # Detect category
        detected_category = "other"
        max_cat_matches = 0
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in message_lower)
            if matches > max_cat_matches:
                max_cat_matches = matches
                detected_category = category
        
        return {
            "intent": detected_intent,
            "category": detected_category if max_cat_matches > 0 else None
        }
    
    def _determine_priority(self, message: str, sentiment: dict, user: dict) -> str:
        """Determine conversation priority"""
        message_lower = message.lower()
        
        # Urgent keywords
        if any(kw in message_lower for kw in self.URGENT_KEYWORDS):
            return "urgent"
        
        # VIP users get high priority
        if user.get("tags") and "vip" in user.get("tags", []):
            return "high"
        
        # High value customers get high priority
        if user.get("total_spent", 0) > 5000 or user.get("order_count", 0) > 10:
            return "high"
        
        # Negative sentiment increases priority
        if sentiment.get("sentiment") == "negative":
            return "high"
        
        # Complaints are high priority
        complaint_keywords = ["شكوى", "مشكلة", "استرجاع", "تالف", "غاضب"]
        if any(kw in message_lower for kw in complaint_keywords):
            return "high"
        
        return "medium"

    async def _handle_handoff(
        self, 
        user: dict, 
        conversation_id: str, 
        message: str,
        reason: str
    ) -> dict:
        """Handle human handoff"""
        # Mark conversation as escalated
        await self.memory.conversations.update_one(
            {"_id": conversation_id},
            {
                "$set": {
                    "escalated": True,
                    "escalated_at": datetime.utcnow(),
                    "escalation_reason": reason
                }
            }
        )
        
        # Save handoff message
        handoff_response = "فهمت، هحولك لأحد زملائي دلوقتي. حد هيتواصل معاك في أقرب وقت 🙏"
        
        await self.memory.append_message(
            conversation_id=conversation_id,
            role="assistant",
            content=handoff_response,
            metadata={"handoff": True, "reason": reason}
        )
        
        # TODO: Send notification to human agents
        
        return {
            "success": True,
            "response": handoff_response,
            "user_id": user["_id"],
            "conversation_id": conversation_id,
            "needs_handoff": True,
            "handoff_reason": reason
        }

    async def _build_context(
        self, 
        user: dict, 
        conversation_id: str,
        current_message: str
    ) -> dict:
        """Build context for AI generation"""
        # Get conversation history
        history = await self.memory.get_recent_messages(conversation_id, limit=10)
        
        # Get relevant knowledge
        knowledge = await self.memory.search_knowledge(current_message, limit=5)
        
        # Get user facts
        user_facts = await self.memory.recall_user_facts(
            user["_id"], 
            current_message, 
            limit=3
        )
        
        # Build business context
        business = {
            "bot_name": self.settings.bot_name,
            "personality": self.settings.bot_personality,
            "dialect": self.settings.bot_dialect
        }
        
        return {
            "user": {
                "id": user["_id"],
                "name": user.get("name"),
                "order_count": user.get("order_count", 0),
                "total_spent": user.get("total_spent", 0),
                "tags": user.get("tags", [])
            },
            "history": [
                {"role": m["role"], "content": m["content"]}
                for m in history
            ],
            "knowledge": knowledge,
            "user_facts": user_facts,
            "business": business
        }

    def _extract_actions_fast(self, message: str, classification: dict) -> list[dict]:
        """
        Fast action extraction using keyword matching only.
        No AI calls - just pattern matching for speed.
        """
        actions = []
        message_lower = message.lower()
        intent = classification.get("intent", "general")
        
        # Check for order intent
        if intent == "sales" or any(kw in message_lower for kw in ["طلب", "اشتري", "اطلب", "عايز", "هاخد"]):
            actions.append({"type": "potential_order", "confidence": 0.7})
        
        # Check for booking intent
        if intent == "booking" or any(kw in message_lower for kw in ["حجز", "موعد", "ميعاد", "احجز"]):
            actions.append({"type": "potential_booking", "confidence": 0.7})
        
        # Check for complaint
        if intent == "complaint" or any(kw in message_lower for kw in ["مشكلة", "شكوى", "استرجاع", "استبدال"]):
            actions.append({"type": "complaint", "confidence": 0.8})
        
        return actions

    async def _extract_actions(
        self, 
        message: str, 
        response: str, 
        context: dict
    ) -> list[dict]:
        """Extract actionable items from conversation (legacy - kept for compatibility)"""
        classification = self._classify_message(message)
        return self._extract_actions_fast(message, classification)

    async def _extract_and_store_facts(
        self, 
        user_id: str, 
        message: str, 
        response: str
    ) -> None:
        """Extract and store important facts about user"""
        # Extract entities
        entities = await self.ai_engine.extract_entities(message)
        
        for entity in entities.get("entities", []):
            if entity["type"] in ["product", "preference"]:
                fact = f"مهتم بـ: {entity['value']}"
                await self.memory.store_user_fact(user_id, fact)

    async def get_conversation_summary(self, conversation_id: str) -> str:
        """Generate summary of conversation for handoff"""
        messages = await self.memory.get_recent_messages(conversation_id, limit=20)
        
        if not messages:
            return "لا توجد رسائل"
        
        # Simple summary - could use AI for better summary
        user_messages = [m["content"] for m in messages if m["role"] == "user"]
        
        return f"المحادثة تتضمن {len(messages)} رسالة. آخر رسالة: {user_messages[-1] if user_messages else 'N/A'}"

    async def get_active_conversations(self, limit: int = 50) -> list[dict]:
        """Get all active conversations with user info"""
        cursor = self.memory.conversations.find(
            {"status": "active"}
        ).sort("updated_at", -1).limit(limit)
        
        conversations = await cursor.to_list(length=limit)
        
        # Enrich with user info
        for conv in conversations:
            user = await self.memory.get_user(conv["user_id"])
            if user:
                conv["user"] = {
                    "name": user.get("name"),
                    "phone": user.get("phone"),
                    "tags": user.get("tags", [])
                }
            
            # Get last message
            last_messages = await self.memory.get_recent_messages(conv["_id"], limit=1)
            if last_messages:
                conv["last_message"] = last_messages[-1]["content"]
        
        return conversations
