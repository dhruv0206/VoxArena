# VoxArena — Agent Context

## Project Overview
Open-source voice AI platform with three services.

## Services
| Service  | Stack                                              | Local URL             |
|----------|----------------------------------------------------|-----------------------|
| frontend | Next.js 16, React 19, Tailwind, Clerk              | http://localhost:3000 |
| backend  | FastAPI, SQLAlchemy, PostgreSQL                    | http://localhost:8000 |
| agent    | Python, LiveKit, AssemblyAI, Gemini, Resemble AI   | N/A                   |

## Database
Main: postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/voxarena
Test: postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/voxarena_test
(Set POSTGRES_PASSWORD in backend/.env)

## How to Run Each Service
frontend → cd frontend && npm run dev
backend  → cd backend && venv\Scripts\activate && uvicorn app.main:app --reload
agent    → cd agent && venv\Scripts\activate && python agent.py dev

## Rules Every Agent Must Follow
- NEVER hardcode secrets — always use .env files
- NEVER commit .env files
- Always read .claude/api-contracts.md before touching any API
- If you change an endpoint shape → update api-contracts.md first
- All /api/dashboard/* routes require Clerk auth middleware
- Run your verification script before reporting done
- Write to .claude/run-state.json at every step

## Key Integrations
- Auth: Clerk (frontend SDK + backend middleware)
- Real-time: LiveKit (do not break room/token flow)
- STT: AssemblyAI / Deepgram
- LLM: Google Gemini
- TTS: Resemble AI
- Telephony: Twilio