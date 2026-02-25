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

### Dashboard
GET /api/dashboard/metrics → {
  totalSessions, totalAgents,
  avgDuration, sessionsToday,
  transcriptsToday
}

### Usage Events (agent worker → backend)
POST /api/usage/events    → UsageEvent
Body: { session_id, user_id, agent_id, provider, event_type, quantity, unit_cost, total_cost }

UsageEvent: { id, session_id, user_id, agent_id, provider, event_type, quantity, unit_cost, total_cost, created_at }

event_type enum: stt_minutes | llm_tokens | tts_characters

### Costs (dashboard read endpoints)
GET /api/costs/summary                          → CostSummary
GET /api/costs/timeline?period=daily&start_date=&end_date= → TimelinePoint[]
GET /api/costs/by-agent                         → AgentCost[]
GET /api/sessions/:id/cost-breakdown            → SessionCostBreakdown

CostSummary: { total_cost, this_month_cost, by_provider: { [provider]: cost } }
TimelinePoint: { date, total_cost, by_provider: { [provider]: cost } }
AgentCost: { agent_id, agent_name, total_cost, session_count, event_count }
SessionCostBreakdown: { session_id, total_cost, events: UsageEvent[], cost_by_type: { [event_type]: cost } }

### Cost Rates (configurable)
- Deepgram STT: $0.0043/min
- AssemblyAI STT: $0.0085/min
- ElevenLabs STT: $0.0069/min
- Gemini LLM: $0.000075/1K tokens
- Resemble TTS: $0.0003/char

## Rules
- Change an endpoint → update this file first
- Frontend must match these shapes exactly
- QA agent validates responses against these shapes