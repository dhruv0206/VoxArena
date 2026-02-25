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

### Costs
GET /api/dashboard/costs/summary?start_date=&end_date= → {
  total_cost: number,
  this_month_cost: number,
  avg_cost_per_call: number,
  total_calls: number
}

GET /api/dashboard/costs/by-provider?start_date=&end_date= → {
  providers: Array<{ provider: string, cost: number, calls: number }>
}

GET /api/dashboard/costs/timeline?start_date=&end_date=&granularity=daily|weekly|monthly → {
  timeline: Array<{ date: string, costs: Record<string, number>, total: number }>
}

GET /api/dashboard/costs/by-agent?start_date=&end_date=&sort_by=total_cost|calls|avg_cost&sort_dir=asc|desc → {
  agents: Array<{ agent_id: string, agent_name: string, calls: number, total_cost: number, avg_cost_per_call: number }>
}

GET /api/sessions/:id/costs → {
  session_id: string,
  total_cost: number,
  breakdown: Array<{ provider: string, service: string, units: number, unit_label: string, cost: number }>
}

## Rules
- Change an endpoint → update this file first
- Frontend must match these shapes exactly
- QA agent validates responses against these shapes