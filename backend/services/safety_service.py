from __future__ import annotations

import logging
import re
from typing import Any, Optional

from config import get_settings

logger = logging.getLogger(__name__)


class SafetyService:
    """
    Safety service for response validation, PII protection, and content filtering.
    """

    # Blocked patterns (spam, scam indicators)
    BLOCKED_PATTERNS = [
        r"اضغط هنا فوراً",
        r"عرض لفترة محدودة جداً",
        r"ربح مضمون",
        r"اربح \d+ جنيه",
        r"مبروك ربحت",
        r"bit\.ly",
        r"tinyurl\.com",
        r"click here",
        r"hack",
        r"phish",
    ]

    # PII patterns
    PII_PATTERNS = {
        "credit_card": r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
        "egypt_phone": r"\b01[0125]\d{8}\b",
        "email": r"\b[\w.-]+@[\w.-]+\.\w+\b",
        "national_id": r"\b[23]\d{13}\b",  # Egyptian national ID
    }

    # Forbidden promises (things bot shouldn't promise)
    FORBIDDEN_PROMISES = [
        "ضمان مدى الحياة",
        "استرجاع فوري",
        "تعويض كامل",
        "مجاناً تماماً",
        "بدون أي شروط",
    ]

    # Uncertainty phrases
    UNCERTAINTY_PHRASES = [
        "خليني أتأكد",
        "هسأل وأرد عليك",
        "مش متأكد",
        "هراجع",
    ]

    def __init__(self) -> None:
        self.settings = get_settings()

    async def validate_response(
        self, 
        response: str, 
        context: dict
    ) -> str:
        """
        Validate and sanitize AI response.
        
        Args:
            response: The AI generated response
            context: Conversation context with knowledge
            
        Returns:
            Sanitized response
        """
        # Step 1: Check for blocked patterns
        response = self._remove_blocked_patterns(response)
        
        # Step 2: Mask any PII
        response = self._mask_pii(response)
        
        # Step 3: Check for forbidden promises
        response = self._check_promises(response)
        
        # Step 4: Anti-hallucination check
        response = await self._check_hallucination(response, context)
        
        # Step 5: Ensure response is not empty
        if not response.strip():
            response = "خليني أتأكد من المعلومة وأرد عليك"
        
        # Step 6: Ensure reasonable length
        response = self._ensure_reasonable_length(response)
        
        return response

    def _remove_blocked_patterns(self, text: str) -> str:
        """Remove blocked patterns from text"""
        for pattern in self.BLOCKED_PATTERNS:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        return text.strip()

    def _mask_pii(self, text: str) -> str:
        """Mask personally identifiable information"""
        for pii_type, pattern in self.PII_PATTERNS.items():
            matches = re.findall(pattern, text)
            for match in matches:
                if pii_type == "credit_card":
                    # Keep last 4 digits
                    masked = "****-****-****-" + match[-4:]
                elif pii_type == "egypt_phone":
                    # Keep first 3 and last 2
                    masked = match[:3] + "****" + match[-2:]
                elif pii_type == "email":
                    # Mask middle of email
                    parts = match.split("@")
                    if len(parts) == 2:
                        username = parts[0]
                        if len(username) > 2:
                            masked = username[0] + "***" + username[-1] + "@" + parts[1]
                        else:
                            masked = "***@" + parts[1]
                    else:
                        masked = "***"
                else:
                    masked = "***"
                
                text = text.replace(match, masked)
        
        return text

    def _check_promises(self, text: str) -> str:
        """Check for forbidden promises and soften them"""
        text_lower = text.lower()
        
        for promise in self.FORBIDDEN_PROMISES:
            if promise in text_lower:
                # Add disclaimer
                text = text.replace(
                    promise, 
                    f"{promise} (حسب الشروط والأحكام)"
                )
        
        return text

    async def _check_hallucination(
        self, 
        response: str, 
        context: dict
    ) -> str:
        """
        Check if response contains potentially hallucinated information.
        If uncertain, add uncertainty phrase.
        """
        knowledge = context.get("knowledge", [])
        
        # Check for specific claims (prices, dates, policies)
        price_pattern = r"\b\d+\s*(جنيه|دولار|ريال|ج\.م)"
        prices_mentioned = re.findall(price_pattern, response)
        
        # If prices mentioned but no knowledge about prices
        if prices_mentioned and not any("سعر" in k or "جنيه" in k for k in knowledge):
            # Add uncertainty
            if not any(phrase in response for phrase in self.UNCERTAINTY_PHRASES):
                response = response + "\n\n(خليني أتأكد من السعر الحالي)"
        
        # Check for policy claims
        policy_keywords = ["سياسة", "شروط", "استرجاع", "ضمان", "توصيل"]
        for keyword in policy_keywords:
            if keyword in response:
                # Check if we have knowledge about this
                if not any(keyword in k for k in knowledge):
                    if not any(phrase in response for phrase in self.UNCERTAINTY_PHRASES):
                        response = response + f"\n\n(هتأكد من {keyword} وأرد عليك)"
                        break
        
        return response

    def _ensure_reasonable_length(self, text: str, max_length: int = 500) -> str:
        """Ensure response is not too long"""
        if len(text) > max_length:
            # Find a good break point
            truncated = text[:max_length]
            last_period = truncated.rfind(".")
            last_question = truncated.rfind("؟")
            last_exclaim = truncated.rfind("!")
            
            break_point = max(last_period, last_question, last_exclaim)
            
            if break_point > max_length * 0.5:
                text = truncated[:break_point + 1]
            else:
                text = truncated + "..."
        
        return text

    def validate_outgoing_message(self, message: str, context: dict) -> dict:
        """
        Validate outgoing message for WhatsApp safety.
        
        Returns:
            Dict with is_valid, issues, and sanitized_message
        """
        issues = []
        
        # Check 1: Message length
        if len(message) > 4000:
            issues.append("message_too_long")
        
        # Check 2: Links in first message
        if context.get("is_first_message"):
            if re.search(r"https?://", message):
                issues.append("link_in_first_message")
        
        # Check 3: Too many links
        links = re.findall(r"https?://\S+", message)
        if len(links) > 1:
            issues.append("too_many_links")
        
        # Check 4: All caps (spammy)
        words = message.split()
        caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
        if caps_words > len(words) * 0.3:
            issues.append("too_much_caps")
        
        # Check 5: Blocked patterns
        for pattern in self.BLOCKED_PATTERNS:
            if re.search(pattern, message, re.IGNORECASE):
                issues.append(f"blocked_pattern: {pattern}")
        
        # Sanitize
        sanitized = message
        if "too_much_caps" in issues:
            sanitized = sanitized.lower()
        if "link_in_first_message" in issues:
            sanitized = re.sub(r"https?://\S+", "[link removed]", sanitized)
        
        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "sanitized_message": sanitized
        }

    def rate_limit_check(
        self, 
        user_id: str, 
        message_count_today: int,
        message_count_hour: int
    ) -> dict:
        """
        Check if user/number has hit rate limits.
        
        Returns:
            Dict with is_allowed and wait_seconds
        """
        settings = self.settings
        
        if message_count_hour >= settings.rate_limit_messages_per_hour:
            return {
                "is_allowed": False,
                "reason": "hourly_limit",
                "wait_seconds": 3600
            }
        
        if message_count_today >= settings.rate_limit_messages_per_day:
            return {
                "is_allowed": False,
                "reason": "daily_limit",
                "wait_seconds": 86400
            }
        
        return {
            "is_allowed": True,
            "reason": None,
            "wait_seconds": 0
        }

    def sanitize_user_input(self, text: str) -> str:
        """Sanitize user input before processing"""
        # Remove excessive whitespace
        text = " ".join(text.split())
        
        # Remove potential injection attempts
        text = re.sub(r"<[^>]+>", "", text)  # Remove HTML tags
        text = re.sub(r"\{[^}]+\}", "", text)  # Remove template syntax
        
        # Limit length
        if len(text) > 2000:
            text = text[:2000]
        
        return text.strip()

    def detect_spam(self, message: str, user_history: list) -> dict:
        """
        Detect if message is spam.
        
        Returns:
            Dict with is_spam and confidence
        """
        spam_indicators = 0
        
        # Check for repeated messages
        if user_history:
            recent_messages = [m.get("content", "") for m in user_history[-5:]]
            if message in recent_messages:
                spam_indicators += 2
        
        # Check for spam patterns
        spam_patterns = [
            r"(.)\1{4,}",  # Repeated characters (hhhhh, aaaaa)
            r"(\b\w+\b)(\s+\1){2,}",  # Repeated words
            r"https?://\S+.*https?://\S+",  # Multiple URLs
        ]
        
        for pattern in spam_patterns:
            if re.search(pattern, message):
                spam_indicators += 1
        
        # Check message length anomalies
        if len(message) > 1500:
            spam_indicators += 1
        
        is_spam = spam_indicators >= 2
        confidence = min(spam_indicators * 0.25, 1.0)
        
        return {
            "is_spam": is_spam,
            "confidence": confidence,
            "indicators": spam_indicators
        }
