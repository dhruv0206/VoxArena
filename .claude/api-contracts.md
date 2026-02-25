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
  Query params: page, limit, start_date, end_date, direction (inbound|outbound)
GET /api/sessions/:id     → Session
GET /api/sessions/:id/analysis → CallAnalysis | null

Session: { id, agentId, startedAt, endedAt, transcript, duration, analysis?, direction?,
           transferredTo?, transferType?, transferTimestamp? }

CallAnalysis: { summary, sentiment, sentiment_score, topics, outcome, action_items }

### Outbound Calls
POST /api/telephony/outbound/call → { call_id, status }
  Body: { agent_id, phone_number }
  Initiates an outbound call from the agent to the given phone number.

GET  /api/telephony/outbound/call/:call_id/status → { call_id, status, duration, phone_number }
  Returns current call status: ringing | answered | completed | failed

POST /api/telephony/outbound/call/:call_id/end → { success: boolean }
  Ends an active outbound call.

### Call Transfer
POST /api/sessions/:id/transfer → TransferResponse
Body: { phone_number: string (E.164), type: "warm" | "cold" }

TransferResponse: { session_id, transfer_type, transferred_to, status, message }

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

### Outbound Calls
POST /api/calls/outbound   → OutboundCallResponse
Body: { agent_id, phone_number (E.164), callback_url? }
Headers: x-user-id (Clerk ID)

OutboundCallResponse: { call_id, room_name, status }

GET /api/calls/:id/status  → CallStatusResponse

CallStatusResponse: { call_id, status, call_status, call_direction,
                      outbound_phone_number, room_name, started_at,
                      ended_at, duration }

Session (updated): { ..., call_direction?: "INBOUND"|"OUTBOUND",
                     outbound_phone_number?: string,
                     call_status?: "RINGING"|"ANSWERED"|"COMPLETED"|"FAILED"|"NO_ANSWER" }

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