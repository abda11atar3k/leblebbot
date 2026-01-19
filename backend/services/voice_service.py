class VoiceService:
    async def transcribe(self, audio_bytes: bytes) -> dict:
        return {"text": "", "status": "placeholder"}
