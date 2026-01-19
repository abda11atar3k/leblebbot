class SafetyService:
    def __init__(self) -> None:
        self.blocked_terms = {"hack", "phish"}

    def validate(self, response: str) -> str:
        for term in self.blocked_terms:
            if term in response.lower():
                return "I'm sorry, I can't help with that."
        return response
