# LeblebBot

AI-powered customer support chatbot platform with multi-channel support.

## Features

- **AI-Powered Conversations**: Uses Groq (Llama 3.1) for intelligent responses
- **Multi-Channel Support**: WhatsApp, Messenger, Telegram, Instagram (coming soon)
- **Smart Routing**: Automatically routes to fast or smart model based on intent
- **Long-Term Memory**: Remembers customer preferences and history
- **Human Handoff**: Automatically escalates complex issues to humans
- **Real-Time Dashboard**: Beautiful Next.js dashboard with Arabic support
- **Rate Limiting**: Built-in protection against spam and abuse
- **Broadcast System**: Send messages to multiple customers with scheduling

## Quick Start

### 1. Clone and Setup

```bash
# Copy environment file
cp env.example .env

# Edit .env and add your API keys
nano .env
```

### 2. Start Services

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
```

### 3. Access Dashboard

- Dashboard: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Services

| Service | Port | Description |
|---------|------|-------------|
| Dashboard | 3000 | Next.js frontend |
| Backend | 8000 | FastAPI backend |
| MongoDB | 27017 | Main database |
| Redis | 6379 | Cache & sessions |
| ChromaDB | 8001 | Vector database |
| Evolution API | 8080 | WhatsApp connection |
| PostgreSQL | 5432 | Evolution API database |

## Configuration

### Required Environment Variables

```env
# AI - Get from https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxx

# Security
JWT_SECRET=your-secret-key
API_KEY=your-api-key

# Evolution API (WhatsApp)
EVOLUTION_API_KEY=your-evolution-key
```

### Optional Variables

See `env.example` for all available configuration options including:
- Bot personality and dialect
- Rate limiting settings
- Google integrations (Calendar, Sheets)
- Payment gateways (Paymob, Fawry)
- Shipping (Bosta)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│                    (Next.js Dashboard)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                              │
│                    (FastAPI + Python)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  AI Engine  │  │Conversation │  │   Safety    │        │
│  │   (Groq)    │  │   Service   │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    MongoDB    │   │     Redis     │   │   ChromaDB    │
│   (Storage)   │   │    (Cache)    │   │   (Vectors)   │
└───────────────┘   └───────────────┘   └───────────────┘
```

## API Endpoints

### Chat
- `POST /chat` - Process message and get AI response
- `GET /conversations` - List all conversations
- `GET /conversations/{id}` - Get conversation with messages

### Users
- `GET /users` - List all users
- `GET /users/{id}` - Get user details

### Analytics
- `GET /analytics` - Get dashboard analytics

### Connectors
- `GET /connectors` - List available connectors
- `POST /connectors/{type}/connect` - Connect to channel
- `GET /connectors/{type}/qr` - Get WhatsApp QR code
- `GET /connectors/{type}/status` - Check connection status

### Webhooks
- `POST /webhook/whatsapp` - WhatsApp webhook
- `POST /webhook/messenger` - Messenger webhook
- `POST /webhook/telegram` - Telegram webhook

## WhatsApp Setup

1. Start the Evolution API container
2. Go to Dashboard > Connectors > WhatsApp
3. Click "Connect"
4. Scan QR code with WhatsApp
5. Done! Messages will be automatically processed

## Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd dashboard
npm install
npm run dev
```

## Tech Stack

### Backend
- Python 3.11
- FastAPI
- Groq (Llama 3.1)
- MongoDB (Motor)
- Redis
- ChromaDB

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## License

MIT License - See LICENSE file for details.

## Support

For support, email support@leblebbot.com or open an issue on GitHub.
