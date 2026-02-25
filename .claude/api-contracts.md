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

Session: { id, agentId, startedAt, endedAt, transcript, duration, analysis?, direction? }

CallAnalysis: { summary, sentiment, sentiment_score, topics, outcome, action_items }

### Outbound Calls
POST /api/telephony/outbound/call → { call_id, status }
  Body: { agent_id, phone_number }
  Initiates an outbound call from the agent to the given phone number.

GET  /api/telephony/outbound/call/:call_id/status → { call_id, status, duration, phone_number }
  Returns current call status: ringing | answered | completed | failed

POST /api/telephony/outbound/call/:call_id/end → { success: boolean }
  Ends an active outbound call.

### LiveKit
POST /api/livekit/token   → { token: string, roomName: string }
Body: { agentId, roomName }

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

## Rules
- Change an endpoint → update this file first
- Frontend must match these shapes exactly
- QA agent validates responses against these shapes