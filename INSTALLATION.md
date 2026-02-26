# Installation Guide

## Quick Start (Docker Compose)

The easiest way to run VoxArena. All 4 services start with one command.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- API keys for: LiveKit, AssemblyAI (or Deepgram/ElevenLabs), Google Gemini, Resemble AI, Clerk

### 1. Clone the Repository

```bash
git clone https://github.com/dhruv0206/VoxArena.git
cd VoxArena
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp agent/.env.example agent/.env
```

Edit each file and add your API keys. See [Environment Variables](#environment-variables) below.

> **Note**: The database password defaults to `voxarena_dev` for local development. To override, set `DB_PASSWORD` as an environment variable before running Docker Compose.

### 3. Run

```bash
docker-compose up -d --build
```

This starts 4 services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Voice Agent | Connected to LiveKit |
| PostgreSQL | localhost:5432 |

### 4. Open the Dashboard

Visit http://localhost:3000 and sign in with Clerk.

---

## Local Development (Without Docker)

Run each service individually for development with hot-reload.

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally
- API keys for all services

### Database Setup

Create the database in PostgreSQL:

```sql
CREATE DATABASE voxarena;
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start dev server
npm run dev
```

Frontend runs at http://localhost:3000.

### Agent

```bash
cd agent

# Create virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start the agent
python agent.py dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_PASSWORD` | Yes | PostgreSQL password (used to build `DATABASE_URL` and by Docker Compose) |
| `DATABASE_URL` | No | Full PostgreSQL connection string (overrides `DB_PASSWORD` if set) |
| `LIVEKIT_API_KEY` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_URL` | Yes | LiveKit server URL (e.g., `wss://your-project.livekit.cloud`) |
| `RESEMBLE_API_KEY` | Yes | From [Resemble AI](https://app.resemble.ai/account/api) |
| `TWILIO_ACCOUNT_SID` | For telephony | From [Twilio Console](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | For telephony | From [Twilio Console](https://console.twilio.com) |
| `TWILIO_SIP_DOMAIN` | For telephony | Your SIP domain (e.g., `your-domain.sip.livekit.cloud`) |
| `FRONTEND_URL` | No | CORS origin (default: `http://localhost:3000`) |
| `PORT` | No | Server port (default: `8000`) |
| `DEBUG` | No | Debug mode (default: `true`) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | From [Clerk](https://clerk.com) |
| `CLERK_SECRET_KEY` | Yes | From [Clerk](https://clerk.com) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (e.g., `http://localhost:8000/api`) |
| `LIVEKIT_API_KEY` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_URL` | Yes | LiveKit server URL |
| `GOOGLE_API_KEY` | No | For LLM model listing in agent config UI |
| `DEEPGRAM_API_KEY` | No | For STT model listing in agent config UI |
| `RESEMBLE_API_KEY` | No | For TTS voice listing in agent config UI |
| `RESEMBLE_PROJECT_UUID` | No | Resemble project UUID |

### Agent (`agent/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_API_KEY` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | Yes | From [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_URL` | Yes | LiveKit server URL |
| `GOOGLE_API_KEY` | Yes | From [Google AI Studio](https://aistudio.google.com/app/apikey) — for Gemini LLM |
| `RESEMBLE_API_KEY` | Yes | From [Resemble AI](https://app.resemble.ai) |
| `RESEMBLE_PROJECT_UUID` | Yes | Resemble project UUID |
| `RESEMBLE_VOICE_UUID` | Yes | Default voice UUID (fallback when agent has no voice configured) |
| `ASSEMBLYAI_API_KEY` | For AssemblyAI STT | From [AssemblyAI](https://www.assemblyai.com) |
| `ELEVENLABS_API_KEY` | For ElevenLabs STT | From [ElevenLabs](https://elevenlabs.io) |
| `DEEPGRAM_API_KEY` | For Deepgram STT | From [Deepgram](https://console.deepgram.com) |

> **Note**: You need at least one STT provider key. AssemblyAI is the default.

---

## Docker Compose Services

```yaml
services:
  postgres:       # PostgreSQL 15 — port 5432
  backend:        # FastAPI — port 8000 (depends on postgres)
  agent:          # LiveKit agent (depends on backend)
  frontend:       # Next.js — port 3000 (depends on backend)
```

### Docker Networking

When running in Docker, services communicate internally:
- Frontend calls backend at `http://localhost:8000/api` (via `NEXT_PUBLIC_API_URL`, port mapped to host)
- Agent calls backend at `http://backend:8000/api` (via `BACKEND_API_URL`, internal Docker network)
- Backend connects to PostgreSQL at `postgres:5432`

### Useful Commands

```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v

# Rebuild a single service
docker-compose up -d --build backend
```

---

## LiveKit Setup

LiveKit handles real-time audio between the browser, voice agent, and phone calls.

1. Create an account at [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project and copy your **API Key**, **API Secret**, and **WebSocket URL**
3. Add to `backend/.env`, `frontend/.env.local`, and `agent/.env`:
   ```
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

Docs: [LiveKit Getting Started](https://docs.livekit.io/home/get-started/) | [LiveKit Agents Quickstart](https://docs.livekit.io/agents/quickstarts/sip/)

---

## Twilio Telephony Setup (Optional)

Required only for inbound/outbound phone calls. Not needed for browser-based voice testing.

1. Create a [Twilio account](https://www.twilio.com) and buy a phone number
2. Set up an Elastic SIP Trunk and connect it to LiveKit
3. Create LiveKit inbound/outbound SIP trunks and dispatch rules
4. Add to `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_SIP_DOMAIN=your-domain.pstn.twilio.com
   LIVEKIT_SIP_TRUNK_ID=ST_xxxxxxxxxxxx
   ```

Docs: [LiveKit SIP Trunking](https://docs.livekit.io/sip/) | [LiveKit Inbound Trunk](https://docs.livekit.io/sip/trunk/inbound/) | [LiveKit Outbound Trunk](https://docs.livekit.io/sip/trunk/outbound/) | [LiveKit + Twilio Setup Guide](https://docs.livekit.io/sip/trunk/twilio/) | [Twilio Elastic SIP Trunking](https://www.twilio.com/docs/sip-trunking)

---

## Troubleshooting

### Backend can't connect to database
- Ensure PostgreSQL is running (`docker-compose ps` or check local PostgreSQL service)
- Verify `DATABASE_URL` in `backend/.env` matches your PostgreSQL credentials
- For Docker: the database takes a few seconds to initialize on first run

### Frontend shows "Failed to fetch" errors
- Ensure the backend is running at the URL specified in `NEXT_PUBLIC_API_URL`
- Check CORS: `FRONTEND_URL` in backend `.env` should match your frontend URL

### Agent doesn't connect to calls
- Verify LiveKit credentials match across all three services
- Ensure the LiveKit URL uses `wss://` protocol
- Check that at least one STT provider key is set in `agent/.env`

### Migrations fail
- Ensure PostgreSQL is running and accessible
- Run `alembic upgrade head` from the `backend/` directory with the virtual environment activated
- If migrations are out of sync: `alembic current` shows the current state

### Inbound calls don't reach the agent
- Verify the Twilio trunk has LiveKit's SIP URI as the origination URL
- Check `lk sip inbound list` — the phone number must match exactly (with country code)
- Check `lk sip dispatch list` — a dispatch rule must exist
- Verify LiveKit credentials match between backend and agent

### Outbound calls fail
- Check `LIVEKIT_SIP_TRUNK_ID` in backend `.env` matches the outbound trunk ID
- Verify Twilio credential list is attached to the trunk's termination settings
- Phone numbers must be in E.164 format (e.g., `+15105550100`)
- Check `lk sip outbound list` to verify the outbound trunk exists
