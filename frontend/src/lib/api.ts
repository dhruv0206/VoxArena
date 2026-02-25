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
  direction?: "inbound" | "outbound" | null;
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
