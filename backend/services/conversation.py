from services.ai_engine import AIEngine
from services.memory_service import MemoryService
from services.safety_service import SafetyService


class ConversationService:
    def __init__(self) -> None:
        self.ai_engine = AIEngine()
        self.memory = MemoryService()
        self.safety = SafetyService()

    def process_message(self, user_id: str, message: str) -> dict:
        history = self.memory.get_recent(user_id)
        context = self.ai_engine.build_context(history)
        prompt = f"{context}\nUser: {message}\nAssistant:"
        response = self.ai_engine.generate(prompt)

        safe_response = self.safety.validate(response)
        self.memory.append(user_id, {"role": "user", "content": message})
        self.memory.append(user_id, {"role": "assistant", "content": safe_response})
        return {"reply": safe_response}
