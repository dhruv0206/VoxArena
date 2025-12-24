# 🎤 VoxArena

An open-source voice AI platform for building, testing, and deploying voice agents. Think of it as an open-source alternative to VAPI.

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
| **STT** | Deepgram |
| **LLM** | Google Gemini |
| **TTS** | Resemble AI |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Auth** | Clerk |
| **Real-time** | LiveKit |

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- API keys for: LiveKit, Deepgram, Google AI, Resemble AI, Clerk

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/VoxArena.git
cd VoxArena
```

### 2. Set up the Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -e .
cp .env.example .env
# Edit .env with your credentials

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials

npm run dev
```

### 4. Set up the Agent

```bash
cd agent
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -e .
cp .env.example .env
# Edit .env with your credentials

python agent.py dev
```

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000) and sign in to start using VoxArena!

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
