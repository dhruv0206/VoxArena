# VoxArena

An open-source voice AI platform for building, testing, and deploying voice agents. Connect your own STT, LLM, and TTS providers, configure agents through a web dashboard, and handle inbound/outbound calls with real-time transcription, cost tracking, and post-call intelligence.

## Features

### Voice Pipeline
- **Speech-to-Text**: AssemblyAI (default), ElevenLabs, Deepgram — configurable per agent
- **LLM**: Google Gemini 2.5 Flash with function calling support
- **Text-to-Speech**: Resemble AI with voice selection
- **VAD**: Silero voice activity detection
- **Real-time**: Powered by LiveKit for low-latency audio

### Agent Configuration
- System prompts and first message settings
- Per-agent STT provider selection
- Voice selection from Resemble AI library
- Function/tool calling with HTTP endpoints
- Pre-call and post-call webhooks with variable substitution

### Telephony
- **Inbound calls**: Twilio SIP trunks routed to agents
- **Outbound calls**: Dial phone numbers from the dashboard
- **Call transfer**: Warm and cold transfer to external numbers
- **Phone number management**: Search, buy, assign, and release Twilio numbers

### Dashboard
- **Home**: Session stats, active agents, monthly cost overview
- **Agents**: Create and configure voice agents with full config editor
- **Call Logs**: Browse sessions with transcripts, analysis, and cost breakdown
- **Analytics**: Calls over time, cost breakdown charts
- **Costs**: Cost summary, timeline (daily/weekly/monthly), cost by agent
- **Settings**: User preferences and theme toggle

### Call Intelligence
- AI-generated call summaries
- Sentiment analysis with confidence scores
- Topic extraction
- Outcome classification (resolved, unresolved, transferred, escalated)
- Action item detection

### Cost Tracking
- Per-session cost breakdown (STT minutes, LLM tokens, TTS characters)
- Cost aggregation by provider, agent, and time period
- Timeline charts with daily/weekly/monthly granularity

## Architecture

```
VoxArena/
├── frontend/    # Next.js 16 web dashboard
├── backend/     # FastAPI REST API
├── agent/       # Python LiveKit voice agent
└── docker-compose.yml
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| Backend | FastAPI, SQLAlchemy, PostgreSQL |
| Agent | Python, LiveKit Agents SDK |
| STT | AssemblyAI, ElevenLabs, Deepgram |
| LLM | Google Gemini |
| TTS | Resemble AI |
| Telephony | Twilio |
| Real-time | LiveKit |

### Voice Pipeline Flow

```
Caller Audio → STT → Transcript → LLM → Response → TTS → Agent Audio
                                    ↓
                          Function Tool Execution
                                    ↓
                          Webhook Integration
```

## Documentation

Full docs at **[voxarena.mintlify.app](https://voxarena.mintlify.app)** — quick start, local development, configuration, and interactive API playground.

## Getting Started

```bash
git clone https://github.com/dhruv0206/VoxArena.git
cd VoxArena
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp agent/.env.example agent/.env
# Edit each .env file with your API keys
docker-compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Clerk.

See the [Quick Start (Docker)](https://voxarena.mintlify.app/quickstart) or [Local Development](https://voxarena.mintlify.app/local-development) guide for full instructions.

## API Reference

The backend exposes 32 endpoints across 8 routers, all prefixed with `/api`. See the [interactive API playground](https://voxarena.mintlify.app/api-reference) for full details.

### Agents (`/api/agents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user's agents |
| GET | `/{agent_id}` | Get agent by ID |
| POST | `/` | Create agent |
| PATCH | `/{agent_id}` | Update agent |
| DELETE | `/{agent_id}` | Soft-delete agent |

### Sessions (`/api/sessions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List sessions (paginated, date filterable) |
| GET | `/{session_id}` | Get session details |
| GET | `/{session_id}/transcripts` | Get session transcripts |
| GET | `/{session_id}/analysis` | Get call analysis |
| GET | `/{session_id}/cost-breakdown` | Get cost breakdown |
| POST | `/` | Create session |
| PATCH | `/{session_id}` | Update session |
| POST | `/{session_id}/transcripts` | Add transcript |
| POST | `/{session_id}/transfer` | Initiate call transfer |
| GET | `/by-room/{room_name}` | Lookup by room name |
| POST | `/by-room/{room_name}/end` | End session (triggers analysis) |
| POST | `/by-room/{room_name}/transcripts` | Add transcript by room |

### Calls (`/api/calls`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/outbound` | Initiate outbound call |
| GET | `/{call_id}/status` | Get call status |

### Telephony (`/api/telephony`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/numbers/search` | Search available Twilio numbers |
| POST | `/numbers/buy` | Buy and assign number to agent |
| POST | `/numbers/release` | Release number from agent |
| POST | `/numbers/assign` | Assign existing number to agent |
| GET | `/lookup` | Lookup agent by phone number |

### Costs (`/api/costs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Cost summary with provider breakdown |
| GET | `/timeline` | Cost over time (daily/weekly/monthly) |
| GET | `/by-agent` | Cost breakdown per agent |

### Usage (`/api/usage`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/events` | Log usage event from agent |

### Resemble (`/api/resemble`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/voices` | List voices (paginated, language filter) |
| GET | `/voices/languages` | List available languages |
| GET | `/voices/{voice_id}` | Get voice details |

### LiveKit (`/api/livekit`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/token` | Generate LiveKit access token |
| POST | `/webhook` | Receive LiveKit events |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Project Structure

```
VoxArena/
├── frontend/                    # Next.js 16 dashboard
│   ├── src/
│   │   ├── app/                 # App router pages
│   │   │   ├── dashboard/       # Protected dashboard pages
│   │   │   │   ├── agents/      # Agent management
│   │   │   │   ├── logs/        # Call logs & transcripts
│   │   │   │   ├── analytics/   # Charts & analytics
│   │   │   │   ├── costs/       # Cost dashboard
│   │   │   │   └── settings/    # User settings
│   │   │   ├── voice/           # Voice session UI
│   │   │   └── preview/         # Agent preview/testing
│   │   ├── components/          # React components
│   │   └── lib/                 # Utilities & API types
│   └── package.json
│
├── backend/                     # FastAPI API server
│   ├── app/
│   │   ├── main.py              # App entry point & router registration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── database.py          # Database connection
│   │   ├── config.py            # Environment config
│   │   ├── routers/             # API route handlers
│   │   │   ├── agents.py        # Agent CRUD
│   │   │   ├── sessions.py      # Session management
│   │   │   ├── livekit.py       # LiveKit tokens & webhooks
│   │   │   ├── calls.py         # Outbound calling
│   │   │   ├── telephony.py     # Twilio number management
│   │   │   ├── costs.py         # Cost analytics
│   │   │   ├── usage.py         # Usage event logging
│   │   │   └── resemble.py      # Voice listing
│   │   └── services/            # Business logic
│   │       ├── call_analysis.py # AI call analysis
│   │       ├── call_transfer.py # SIP transfer logic
│   │       └── cost_aggregation.py
│   ├── alembic/                 # Database migrations
│   └── requirements.txt
│
├── agent/                       # LiveKit voice agent
│   ├── agent.py                 # Main agent pipeline
│   └── resemble_tts.py          # Custom Resemble AI TTS plugin
│
├── docker-compose.yml           # Docker orchestration
└── CLAUDE.md                    # AI agent context
```

## Database Schema

### Core Tables
- **users** — Clerk-authenticated users
- **agents** — Voice agent configurations (system prompt, voice, STT provider, functions, webhooks)
- **voice_sessions** — Call records with status, duration, cost, transfer info
- **transcripts** — Per-message conversation logs with speaker labels
- **usage_events** — Granular cost events (STT minutes, LLM tokens, TTS characters)

## Roadmap

- [ ] Multi-LLM support (Claude, GPT-4, etc.)
- [ ] Multi-TTS support (ElevenLabs, PlayHT, etc.)
- [ ] Audio recording storage
- [ ] Multi-agent orchestration module
- [ ] Claude-powered builder chat interface
- [ ] MCP integration for agent tools
- [ ] Visual graph builder for agent flows
- [ ] Embeddable web widget
- [ ] VoxArena Cloud (hosted platform)

## License

MIT License — see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
