# VoxArena API Contracts

## Auth
All /api/* endpoints require Clerk JWT in Authorization header
Except: /api/livekit/webhook, /health

## Endpoints

### Agents
GET    /api/agents        → { agents: Agent[], total: number }
POST   /api/agents        → Agent
GET    /api/agents/:id    → Agent
PUT    /api/agents/:id    → Agent
DELETE /api/agents/:id    → { success: boolean }

Agent: { id, name, systemPrompt, sttProvider,
         llmProvider, ttsProvider, createdAt, updatedAt }

### Sessions
GET /api/sessions         → { sessions: Session[], total: number }
GET /api/sessions/:id     → Session
GET /api/sessions/:id/analysis → CallAnalysis | null

Session: { id, agentId, startedAt, endedAt, transcript, duration, analysis? }

CallAnalysis: { summary, sentiment, sentiment_score, topics, outcome, action_items }

### LiveKit
POST /api/livekit/token   → { token: string, roomName: string }
Body: { agentId, roomName }

### Usage
POST /api/usage/events   → UsageEvent
Body: { session_id, user_id, agent_id?, event_type, provider, usage_data }

event_type: "stt_minutes" | "llm_tokens" | "tts_characters"
usage_data (stt_minutes):    { audio_duration_seconds: float }
usage_data (llm_tokens):     { input_tokens: int, output_tokens: int }
usage_data (tts_characters): { character_count: int }

UsageEvent: { id, session_id, user_id, agent_id?, event_type, provider, usage_data, created_at }

### Dashboard
GET /api/dashboard/metrics → {
  totalSessions, totalAgents,
  avgDuration, sessionsToday,
  transcriptsToday
}

## Rules
- Change an endpoint → update this file first
- Frontend must match these shapes exactly
- QA agent validates responses against these shapes