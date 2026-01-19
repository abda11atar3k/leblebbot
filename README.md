# LeblebBot

LeblebBot is a multi-channel AI chatbot platform with a FastAPI backend and a Next.js dashboard.

## Quick Start

1. Copy environment file (optional):
   - `cp env.example .env`
2. Start the stack:
   - `docker compose up --build`
3. Open dashboard:
   - `http://localhost:3000`

## Services

- Backend: FastAPI on `http://localhost:8000`
- Dashboard: Next.js on `http://localhost:3000`
- MongoDB: `mongodb://localhost:27017`
- Redis: `redis://localhost:6379`
- ChromaDB: `http://localhost:8001`

## Notes

- The connectors for Messenger and Telegram are placeholders.
- WhatsApp uses Evolution API container.
- `env.example` is used by default inside Docker if `.env` is missing.
