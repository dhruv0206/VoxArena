# 🎤 VoxArena

An open-source voice AI platform for building, testing, and deploying voice agents.

## ✨ Features

- **Voice Pipeline**: Speech-to-Text → LLM → Text-to-Speech
- **Real-time Communication**: Powered by LiveKit
- **Modular Architecture**: Swap STT, LLM, and TTS providers easily
- **Dashboard**: Monitor calls, view transcripts, manage agents
- **Session Logging**: Track all voice sessions and conversations

## 🏗️ Architecture

```
VoxArena/
├── agent/      # Python LiveKit voice agent
├── backend/    # FastAPI REST API
└── frontend/   # Next.js web dashboard
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Agent** | Python, LiveKit Agents SDK |
| **STT** | AssemblyAI (default), Deepgram |
| **LLM** | Google Gemini |
| **TTS** | Resemble AI |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Auth** | Clerk |
| **Real-time** | LiveKit |

### Quick Start (Self-Hosted)

The easiest way to run VoxArena is using Docker Compose.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- API keys for: LiveKit, Deepgram, Google Gemini, Resemble AI, Clerk.

### 1. Clone the repository

```bash
git clone https://github.com/dhruv0206/VoxArena.git
cd VoxArena
```

### 2. Configure Environment Variables

Create `.env` files for each service by copying the examples:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Agent
cp agent/.env.example agent/.env
```

**Important:** Edit each `.env` file and add your API keys.

### 3. Run with Docker Compose

```bash
docker-compose up -d --build
```

This will start all services:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Voice Agent**: Connected to LiveKit
- **PostgreSQL**: Database

### 4. Open the Dashboard

Visit [http://localhost:3000](http://localhost:3000) and sign in.


## 📁 Project Structure

### Agent (`/agent`)
Voice agent using LiveKit Agents SDK with:
- `agent.py` - Main voice pipeline agent
- `resemble_tts.py` - Custom Resemble AI TTS plugin

### Backend (`/backend`)
FastAPI server with:
- `/api/agents` - Agent CRUD operations
- `/api/sessions` - Voice session management
- `/api/livekit` - LiveKit token generation

### Frontend (`/frontend`)
Next.js dashboard with:
- `/dashboard` - Main dashboard with metrics
- `/preview` - Voice agent testing
- `/voice` - Voice session interface

## 🔑 Environment Variables

See `.env.example` files in each directory for required variables.

## 🛣️ Roadmap

- [ ] Function/Tool calling for agents
- [ ] Multiple STT/LLM/TTS provider support
- [ ] Telephony integration (Twilio)
- [ ] Embeddable web widget
- [ ] Multi-agent squads
- [ ] A/B testing for agent configurations

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
