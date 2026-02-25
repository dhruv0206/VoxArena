export interface CallAnalysis {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  topics: string[];
  outcome: "resolved" | "unresolved" | "transferred" | "escalated";
  action_items: string[];
}

export interface VoiceSession {
  id: string;
  room_name: string;
  status: "CREATED" | "ACTIVE" | "COMPLETED" | "FAILED" | string;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  user_id: string;
  agent_id: string | null;
  agent_name?: string | null;
  analysis?: CallAnalysis | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SessionsPage {
  sessions: VoiceSession[];
  total: number;
  page: number;
  limit: number;
}

export interface CostSummary {
  total_cost: number;
  this_month_cost: number;
  avg_cost_per_call: number;
  total_calls: number;
}

export interface ProviderCost {
  provider: string;
  cost: number;
  calls: number;
}

export interface CostTimelineEntry {
  date: string;
  costs: Record<string, number>;
  total: number;
}

export interface AgentCost {
  agent_id: string;
  agent_name: string;
  calls: number;
  total_cost: number;
  avg_cost_per_call: number;
}

export interface SessionCostBreakdown {
  provider: string;
  service: string;
  units: number;
  unit_label: string;
  cost: number;
}

export interface SessionCosts {
  session_id: string;
  total_cost: number;
  breakdown: SessionCostBreakdown[];
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  user_id: string;
  phone_number: string | null;
  twilio_sid: string | null;
  created_at: string;
  updated_at: string;
}
