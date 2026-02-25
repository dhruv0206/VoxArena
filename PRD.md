# VoxArena — Product Requirements Document (PRD)

**Version:** 1.1
**Date:** February 25, 2026
**Status:** Phase 1 — Foundation Sprint

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Strategy](#2-vision--strategy)
3. [Current State Assessment](#3-current-state-assessment)
4. [Phase 1: Foundation Sprint (Weeks 1-3)](#4-phase-1-foundation-sprint)
   - WS-1: Add ElevenLabs STT Provider
   - WS-2: Function/Tool Calling
   - WS-3: Call Recording & Playback
   - WS-4: End-of-Call Intelligence
5. [Phase 2: Production Readiness (Weeks 4-5)](#5-phase-2-production-readiness)
   - WS-5: Auth Hardening & API Key Management
   - WS-6: Outbound Calling
   - WS-7: Call Transfer (Warm & Cold)
   - WS-8: Embeddable Web Widget
   - WS-9: Documentation Site
   - WS-10: Cost Tracking & Usage Analytics
6. [Phase 3: Open-Source Launch (Weeks 6-8)](#6-phase-3-open-source-launch)
7. [Phase 4: Cloud & Monetization (Months 3-6)](#7-phase-4-cloud--monetization)
8. [Technical Architecture Reference](#8-technical-architecture-reference)
9. [Database Schema Reference](#9-database-schema-reference)
10. [API Reference](#10-api-reference)
11. [Frontend Reference](#11-frontend-reference)
12. [Environment & Dependencies](#12-environment--dependencies)

---

## 1. Executive Summary

**VoxArena** is an open-source voice AI agent platform built on LiveKit. The goal is to become the **"Supabase of Voice AI"** — an open-core platform that provides a complete dashboard + management layer on top of open-source voice infrastructure.

**Competitive Positioning:**
- **Frameworks** (LiveKit Agents, Pipecat): Code libraries, no UI, developer-only → VoxArena adds the platform layer
- **Proprietary SaaS** (Vapi, Retell, Bland): Closed-source, vendor lock-in, $0.05-0.15/min platform tax → VoxArena is open-source, no platform tax
- **VoxArena's gap**: The only **open-source voice agent PLATFORM** with full dashboard, analytics, function calling, and production features

**Revenue Model:** Open-core
- Free: Self-hosted, unlimited usage, all features
- Paid: VoxArena Cloud (hosted), enterprise features (SSO, SLA, priority support)
- Validated by: Supabase ($70M ARR), n8n ($40M ARR), LiveKit ($10M+ run rate)

**Team:** 5-6 AI coding agents working in parallel via Vibe Kanban

---

## 2. Vision & Strategy

### 2.1 Positioning Statement

> VoxArena is the open-source platform for building, deploying, and managing production voice AI agents. No vendor lock-in. No platform tax. Your infrastructure, your rules.

### 2.2 Target Users (Phase 1-2)

| User | Need | Why VoxArena |
|------|------|-------------|
| Startup CTO | Build voice agents without vendor lock-in | Open-source, self-hosted, no per-minute tax |
| AI Agency | Build voice agents for clients | Multi-provider, white-label potential |
| Enterprise Dev | Internal voice automation | Self-hosted for compliance, security |
| Indie Hacker | Build and sell voice agent products | Free to start, pay when scaling |

### 2.3 Success Metrics for Launch

- 500+ GitHub stars in first month
- 50+ self-hosted deployments (tracked via optional telemetry)
- 10+ community contributors
- Featured on HackerNews front page

### 2.4 Non-Developer Users (Deferred to Phase 4+)

Non-developer friendliness is explicitly deferred. Current UI scores 2/10 for non-developers. Improvements planned for later phases include: jargon simplification, onboarding wizard, voice previews, industry templates, visual flow builder, Simple Mode vs Developer Mode.

---

## 3. Current State Assessment

### 3.1 What Exists Today

| Component | Status | Details |
|-----------|--------|---------|
| LiveKit Agent Worker | Working | STT → LLM → TTS pipeline with VAD |
| STT Providers | 2 providers | Deepgram Nova 2, AssemblyAI |
| LLM Providers | 1 provider (hardcoded) | Google Gemini only (2.5 Flash, 1.5 Flash, 1.5 Pro) |
| TTS Providers | 1 provider (custom) | Resemble AI only (custom LiveKit plugin) |
| Backend API | Working | FastAPI with 5 routers, PostgreSQL |
| Frontend Dashboard | Working | Next.js 16, Clerk auth, agent CRUD, call logs |
| Preview/Testing | Working | Browser-based WebRTC with iPhone mockup + 3D orb |
| Phone Integration | Working | Twilio SIP via LiveKit, number buy/assign/release |
| Webhooks | Working | Pre-call (GET with variable injection) and post-call (POST) |
| Analytics | Basic | Dashboard stats, recent calls, session listing |
| Docker Compose | Working | 4 services (Postgres, Backend, Agent, Frontend) |

### 3.2 Critical Gaps (Phase 1 Targets)

| Gap | Impact | Competitor Comparison |
|-----|--------|----------------------|
| No function/tool calling | Agents can only talk, can't take actions | Vapi, Retell, Bland all have this |
| Limited STT (2 providers) | Missing ElevenLabs STT option | Competitors offer more STT choices |
| No call recording | Can't review/audit calls | Table stakes for every platform |
| No post-call intelligence | No summaries, sentiment, key topics | Vapi/Retell have this built-in |
| Weak auth (header-based) | Not production-safe | Must have for any real deployment |

**Note:** LLM (Gemini) and TTS (Resemble) providers are kept as-is for Phase 1. Multi-provider LLM and TTS expansion is planned for a future phase.

### 3.3 Feature Parity Score

**Current:** ~35-40% of Vapi feature set
**After Phase 1:** ~55-60% (enough for early adopters)
**After Phase 2:** ~80% (production-ready)

---

## 4. Phase 1: Foundation Sprint

**Duration:** Weeks 1-3
**Goal:** Close the critical feature gaps that block anyone from taking VoxArena seriously
**Agents:** 4 workstreams in parallel

**Scope Note:** LLM provider stays as Google Gemini only. TTS provider stays as Resemble AI only. Voice picker stays as-is. Multi-provider LLM/TTS expansion is deferred to a future phase.

---

### WS-1: Add ElevenLabs STT Provider

**Priority:** P1 — Important
**Estimated Complexity:** Low
**Files to Modify:** `agent/agent.py`, `frontend/src/components/agents/agent-settings.tsx`, `frontend/src/app/preview/page.tsx`, `agent/pyproject.toml`

#### 1.1 Problem Statement

STT currently supports only Deepgram and AssemblyAI. Adding ElevenLabs STT gives users a third option with competitive accuracy and latency.

#### 1.2 Requirements

**Must Have:**
- Add ElevenLabs STT via `livekit-plugins-elevenlabs`
- STT provider selectable per-agent (already works for deepgram/assemblyai)
- Frontend dropdown updated with ElevenLabs option
- Preview page updated with same option

#### 1.3 Technical Specification

**Agent Worker Changes (`agent/agent.py`):**

Extend the STT selection block (lines 208-213) to add ElevenLabs:
```python
from livekit.plugins import elevenlabs as elevenlabs_plugin

def create_stt(provider: str):
    if provider == "assemblyai":
        return assemblyai.STT()
    elif provider == "elevenlabs":
        return elevenlabs_plugin.STT()
    else:  # default: deepgram
        return deepgram.STT()
```

**New Dependencies (`agent/pyproject.toml`):**
```
livekit-plugins-elevenlabs>=0.8.0
```

**Frontend Changes (`agent-settings.tsx`):**

Update `STT_PROVIDERS` constant (lines 144-147):
```typescript
const STT_PROVIDERS = [
    { id: "deepgram", name: "Deepgram Nova 2" },
    { id: "assemblyai", name: "AssemblyAI" },
    { id: "elevenlabs", name: "ElevenLabs" },
];
```

**Preview Page Changes (`preview/page.tsx`):**

Same — add ElevenLabs to the STT dropdown in the sidebar panel.

**Environment Variables (new):**
```
ELEVENLABS_API_KEY=...
```

#### 1.4 Testing Criteria

- [ ] Can select ElevenLabs STT in agent settings
- [ ] Agent worker creates correct ElevenLabs STT instance
- [ ] Voice conversation works end-to-end with ElevenLabs STT
- [ ] Preview page works with ElevenLabs STT
- [ ] Existing agents with Deepgram/AssemblyAI still work (backward compatible)
- [ ] Default falls back to Deepgram if not specified
- [ ] Graceful error when ElevenLabs API key is missing

---

### WS-2: Function/Tool Calling

**Priority:** P0 — Showstopper (Most Critical Feature)
**Estimated Complexity:** High
**Files to Modify:** `agent/agent.py`, `backend/app/models.py`, `backend/app/schemas.py`, `backend/app/routers/agents.py`, `frontend/src/components/agents/agent-settings.tsx` (new tab), `frontend/src/lib/api.ts`

#### 2.1 Problem Statement

This is the **#1 missing feature**. Without function/tool calling, VoxArena agents are just voice chatbots. They cannot:
- Book appointments
- Look up customer records
- Transfer calls
- Check inventory
- Process payments
- Take any real-world action

Every competitor (Vapi, Retell, Bland) has this. It's the difference between a toy and a product.

#### 2.2 Requirements

**Must Have:**
- Define custom functions/tools per-agent via the dashboard
- Each function has: name, description, parameters (JSON Schema), and an HTTP endpoint to call
- When the LLM decides to call a function, the agent:
  1. Extracts the function call from the LLM response
  2. Makes an HTTP request to the configured endpoint with the parameters
  3. Feeds the response back to the LLM
  4. LLM generates a natural language response based on the function result
- Function definitions stored in agent config
- UI for adding/editing/deleting functions with parameter schema builder

**Nice to Have:**
- Pre-built function templates (calendar lookup, CRM query, etc.)
- Function call logging/debugging in session transcripts
- Timeout and retry configuration per function
- Authentication header support per function endpoint

#### 2.3 Technical Specification

**Agent Config Schema — New `functions` field:**

```json
{
  "functions": [
    {
      "id": "uuid",
      "name": "check_availability",
      "description": "Check calendar availability for a given date and time",
      "parameters": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "description": "The date to check (YYYY-MM-DD format)"
          },
          "time": {
            "type": "string",
            "description": "The time to check (HH:MM format)"
          }
        },
        "required": ["date", "time"]
      },
      "endpoint": {
        "url": "https://api.example.com/calendar/check",
        "method": "POST",
        "headers": [
          { "key": "Authorization", "value": "Bearer {{API_KEY}}" }
        ],
        "timeout": 10
      },
      "speak_during_execution": true,
      "speak_on_send": "Let me check that for you...",
      "speak_on_complete": ""
    }
  ]
}
```

**Agent Worker Changes (`agent/agent.py`):**

LiveKit Agents SDK supports function calling through the `FunctionTool` class. The implementation:

```python
from livekit.agents import function_tool, RunContext

# Dynamic function creation from config
def create_function_tools(functions_config: list[dict]) -> list:
    tools = []
    for func_config in functions_config:
        # Create a callable that makes HTTP request to the configured endpoint
        async def make_tool_call(
            ctx: RunContext,
            config=func_config,
            **kwargs
        ):
            endpoint = config["endpoint"]
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=endpoint.get("method", "POST"),
                    url=endpoint["url"],
                    json=kwargs,
                    headers={
                        h["key"]: h["value"]
                        for h in endpoint.get("headers", [])
                    },
                    timeout=endpoint.get("timeout", 10),
                )
                return response.json()

        # Register as a function tool with the LLM
        tool = function_tool(
            name=func_config["name"],
            description=func_config["description"],
            parameters=func_config["parameters"],
        )(make_tool_call)
        tools.append(tool)

    return tools

# In the agent session setup:
functions_config = config.get("functions", [])
tools = create_function_tools(functions_config)

session = AgentSession(
    stt=stt,
    llm=google.LLM(),
    tts=tts,
    vad=silero.VAD.load(),
)

# Register tools with the session
for tool in tools:
    session.register_tool(tool)
```

> **Important Note:** The exact LiveKit Agents SDK API for dynamic tool registration may vary by version. The agent implementing this should check the LiveKit Agents SDK documentation (https://docs.livekit.io/agents/) for the current API. The concept is:
> 1. Define callable functions with metadata (name, description, parameters)
> 2. Register them with the AgentSession or pass them to the LLM
> 3. Handle the LLM's function call requests
> 4. Feed results back to the LLM

**Frontend Changes — New "Functions" Tab in `agent-settings.tsx`:**

Add a new tab between "Voice" and "Phone" tabs:

```
[Model] [Voice] [Functions] [Phone] [Webhooks] [Danger Zone]
```

The Functions tab UI:

1. **Function List** — Cards showing each function with name, description, endpoint URL
2. **Add Function Button** — Opens a dialog/drawer:
   - **Name** (text input): Function name (snake_case, alphanumeric)
   - **Description** (textarea): What this function does (sent to LLM)
   - **Parameters** (JSON Schema builder):
     - Add Parameter button
     - Each parameter: name, type (string/number/boolean/array/object), description, required toggle
     - OR: Raw JSON Schema editor toggle for power users
   - **Endpoint Configuration:**
     - URL (text input)
     - Method (GET/POST/PUT/DELETE dropdown)
     - Headers (key-value pairs, like current webhook headers)
     - Timeout (number, seconds, default 10)
   - **Speech Configuration:**
     - "Speak while executing" toggle
     - "Say this when calling function" (text input, e.g., "Let me check that for you...")
3. **Edit/Delete** — Each function card has edit and delete buttons
4. **Templates** — Pre-built function templates:
   - "Check Availability" — calendar/scheduling endpoint
   - "Look Up Customer" — CRM query
   - "Book Appointment" — create booking
   - "Transfer Call" — initiate call transfer
   - "Send SMS" — Twilio SMS

**Function Call Logging:**

When a function is called during a conversation, log it to the transcript:
```json
{
  "content": "[Function Call: check_availability({\"date\": \"2026-03-01\", \"time\": \"14:00\"})] → {\"available\": true}",
  "speaker": "AGENT",
  "type": "function_call"
}
```

This may require adding a `type` field to the Transcript model (or storing in a metadata JSON field) to distinguish regular speech from function calls in the UI.

#### 2.4 Testing Criteria

- [ ] Can add a function with name, description, and parameters via UI
- [ ] Can configure endpoint URL, method, headers, and timeout
- [ ] Agent correctly makes HTTP call when LLM triggers function
- [ ] Function result is fed back to LLM and generates natural response
- [ ] Function calls are logged in session transcripts
- [ ] Multiple functions can be defined per agent
- [ ] Edit and delete functions work correctly
- [ ] Graceful handling when endpoint is unreachable or times out
- [ ] Speak-during-execution works (agent says filler while calling)
- [ ] Backward compatible: existing agents without functions still work

---

### WS-3: Call Recording & Playback

**Priority:** P1 — Expected Feature
**Estimated Complexity:** Medium
**Files to Modify:** `agent/agent.py`, `backend/app/models.py`, `backend/app/schemas.py`, `backend/app/routers/sessions.py`, `backend/app/routers/recordings.py` (new), `frontend/src/app/dashboard/page.tsx`, `frontend/src/components/sessions/` (new components)

#### 3.1 Problem Statement

There is no call recording capability. Users cannot listen back to conversations, which is essential for:
- Quality assurance
- Agent performance review
- Compliance/audit requirements
- Training data collection

#### 3.2 Requirements

**Must Have:**
- Automatic recording of all voice sessions (configurable per-agent)
- Recording stored as audio files (S3-compatible storage or local filesystem)
- Playback UI in the call logs / session detail page
- Recording metadata: duration, file size, format
- Download recording button

**Nice to Have:**
- Recording toggle per-agent (enable/disable)
- Stereo recording (separate tracks for user and agent)
- Recording retention policies (auto-delete after X days)
- Waveform visualization in playback UI

#### 3.3 Technical Specification

**Approach: LiveKit Egress API**

LiveKit has a built-in [Egress API](https://docs.livekit.io/egress/) for recording rooms. This is the recommended approach — no custom audio capture needed.

**Recording Flow:**
1. When a session starts, backend calls LiveKit Egress API to start room composite recording
2. Recording is saved to configured S3-compatible storage (or local file)
3. When session ends, egress stops and final file URL is stored
4. Frontend can play back the recording via the stored URL

**Backend Changes:**

New file: `backend/app/routers/recordings.py`
```
POST /api/recordings/start    — Start recording for a room
POST /api/recordings/stop     — Stop recording for a room
GET  /api/sessions/{id}/recording — Get recording URL for a session
```

**Database Changes (`models.py`):**

Add to VoiceSession model:
```python
recording_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
recording_status: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "recording", "processing", "ready", "failed"
recording_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # seconds
recording_egress_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
```

**Agent Config — Recording Toggle:**
```json
{
  "recording_enabled": true
}
```

**Agent Worker Changes (`agent/agent.py`):**

When session starts, if recording is enabled:
```python
from livekit.api import LiveKitAPI, RoomCompositeEgressRequest

async def start_recording(room_name: str):
    lk_api = LiveKitAPI()
    egress = await lk_api.egress.start_room_composite_egress(
        room_name=room_name,
        file_output=RoomCompositeEgressRequest.EncodedFileOutput(
            file_type="mp4",  # or "ogg" for audio-only
            filepath=f"recordings/{room_name}.mp4",
            # S3 config or local path
        ),
        audio_only=True,
    )
    return egress.egress_id
```

**Frontend Changes:**

In session detail / call log view:
- Audio player component with play/pause, seek, and download
- Recording status indicator (recording, processing, ready)
- Duration display

**Environment Variables (new):**
```
# S3-compatible storage for recordings (optional — can use local filesystem)
RECORDING_S3_BUCKET=voxarena-recordings
RECORDING_S3_REGION=us-east-1
RECORDING_S3_ACCESS_KEY=...
RECORDING_S3_SECRET_KEY=...

# Or local storage
RECORDING_STORAGE_PATH=./recordings
```

#### 3.4 Testing Criteria

- [ ] Recording starts automatically when session begins (if enabled)
- [ ] Recording stops when session ends
- [ ] Recording file is accessible via URL
- [ ] Audio player works in the session detail page
- [ ] Download recording works
- [ ] Recording can be disabled per-agent
- [ ] Graceful handling when storage is not configured

---

### WS-4: End-of-Call Intelligence

**Priority:** P1 — Expected Feature
**Estimated Complexity:** Medium
**Files to Modify:** `agent/agent.py`, `backend/app/models.py`, `backend/app/schemas.py`, `backend/app/routers/sessions.py`, `frontend/src/components/sessions/` (new), `frontend/src/app/dashboard/page.tsx`

#### 4.1 Problem Statement

When a call ends, there's no intelligence extracted. The only data stored is raw transcripts. Missing: call summary, sentiment, key topics, action items, customer satisfaction, call outcome.

#### 4.2 Requirements

**Must Have:**
- Automatic post-call analysis when session ends
- Analysis includes:
  - **Summary:** 2-3 sentence summary of the conversation
  - **Sentiment:** Overall sentiment (positive/neutral/negative) + score (0-1)
  - **Key Topics:** List of topics discussed
  - **Outcome:** Call outcome (resolved/unresolved/transferred/escalated)
  - **Action Items:** List of follow-up actions identified
- Analysis results stored in session metadata
- Analysis results displayed in session detail page
- Analysis results shown in call logs list (summary preview, sentiment badge)

**Nice to Have:**
- Custom analysis prompts (configurable per-agent)
- Call scoring/grading based on rubric
- Exportable analysis reports

#### 4.3 Technical Specification

**Post-Call Analysis Flow:**
1. When a call ends (session status → COMPLETED)
2. Backend collects all transcripts for the session
3. Backend sends transcripts to an LLM with an analysis prompt
4. Results stored in `session_data` JSON field (already exists on VoiceSession model)

**Backend Changes:**

New utility: `backend/app/services/call_analysis.py`

```python
import httpx

ANALYSIS_PROMPT = """Analyze this voice call transcript and return a JSON object with:
{
  "summary": "2-3 sentence summary of the conversation",
  "sentiment": "positive" | "neutral" | "negative",
  "sentiment_score": 0.0-1.0,
  "topics": ["topic1", "topic2"],
  "outcome": "resolved" | "unresolved" | "transferred" | "escalated",
  "action_items": ["action1", "action2"],
  "duration_assessment": "brief" | "normal" | "lengthy"
}

Transcript:
{transcript}
"""

async def analyze_call(transcripts: list[dict]) -> dict:
    """Run post-call analysis on transcripts using LLM."""
    # Format transcripts into readable text
    transcript_text = "\n".join(
        f"{'User' if t['speaker'] == 'USER' else 'Agent'}: {t['content']}"
        for t in transcripts
    )

    # Call Google Gemini for analysis (same LLM provider used by agents)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}",
            json={
                "contents": [
                    {"role": "user", "parts": [{"text": ANALYSIS_PROMPT.format(transcript=transcript_text)}]}
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                },
            },
        )
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
```

**Trigger Point:**

In `backend/app/routers/sessions.py`, in the `end_session_by_room` endpoint (or via a background task):

```python
@router.post("/by-room/{room_name}/end")
async def end_session_by_room(room_name: str, db: Session = Depends(get_db)):
    # ... existing session end logic ...

    # Trigger analysis in background
    from app.services.call_analysis import analyze_call
    transcripts = db.query(Transcript).filter(...).all()
    analysis = await analyze_call([{"speaker": t.speaker.value, "content": t.content} for t in transcripts])

    session.session_data = {
        **(session.session_data or {}),
        "analysis": json.loads(analysis),
    }
    db.commit()
```

**Schema Changes (`schemas.py`):**

Add analysis fields to VoiceSessionResponse:
```python
class VoiceSessionResponse(VoiceSessionBase):
    # ... existing fields ...
    analysis: Optional[dict] = None  # Extracted from session_data["analysis"]
```

**Frontend Changes:**

1. **Session Detail Page** — New "Analysis" section:
   - Summary card
   - Sentiment badge (green/yellow/red with score)
   - Topics as tags/chips
   - Outcome badge
   - Action items checklist

2. **Call Logs List** — Add to each row:
   - Sentiment emoji/badge (small)
   - Summary preview (first line, truncated)
   - Outcome tag

3. **Dashboard Stats** — New metrics:
   - Average sentiment score
   - Resolution rate (% resolved)
   - Top topics this week

#### 4.4 Testing Criteria

- [ ] Analysis runs automatically when call ends
- [ ] Analysis results are stored in session_data
- [ ] Session detail page shows analysis correctly
- [ ] Call logs show sentiment and summary preview
- [ ] Analysis works with different transcript lengths (short, medium, long)
- [ ] Graceful handling when LLM API fails (analysis is optional, call still ends normally)
- [ ] Dashboard stats include analysis metrics

---

## 5. Phase 2: Production Readiness

**Duration:** Weeks 4-5
**Goal:** Add features needed for real production deployments
**Prerequisite:** Phase 1 complete

---

### WS-5: Auth Hardening & API Key Management

**Priority:** P0
**Estimated Complexity:** Medium

#### 5.1 Problem Statement

Current authentication is dangerously weak:
- Backend uses `x-user-id` header (any client can impersonate any user)
- No API key system for programmatic access
- No rate limiting
- No JWT verification from Clerk

#### 5.2 Requirements

**Must Have:**
- Verify Clerk JWT tokens on backend (replace `x-user-id` header)
- API key generation, listing, and revocation via dashboard
- API keys stored hashed in database (like passwords)
- Rate limiting per user/API key (configurable)
- API key authentication as alternative to Clerk JWT (for programmatic access)

**Must Have (Database):**
- New `api_keys` table:
  ```
  id (PK), user_id (FK), name, key_prefix (first 8 chars for display),
  key_hash (hashed key), scopes (JSON), last_used_at, expires_at,
  created_at, is_active
  ```

**Must Have (Frontend):**
- New "API Keys" page under Build section in dashboard sidebar
- Create key dialog (name, scopes, expiration)
- Key list with last used, created date, revoke button
- Show full key only once on creation (then only prefix)

**Must Have (Backend):**
- Middleware that checks for:
  1. `Authorization: Bearer <clerk-jwt>` → verify with Clerk
  2. `Authorization: Bearer <api-key>` → verify against hashed keys
  3. Reject if neither is valid
- Rate limiter middleware (e.g., `slowapi`)

#### 5.3 Implementation Notes

- Use Clerk's Python SDK for JWT verification: `clerk-backend-api`
- Hash API keys with `bcrypt` or `sha256` (sha256 is fine for API keys)
- Rate limiting: 100 requests/min for free tier, configurable per key
- Scopes: `agents:read`, `agents:write`, `sessions:read`, `sessions:write`, `recordings:read`

---

### WS-6: Outbound Calling

**Priority:** P1
**Estimated Complexity:** Medium

#### 6.1 Problem Statement

Currently only inbound calling works (Twilio → SIP → LiveKit → Agent). Outbound calling (agent initiates call to a phone number) is needed for use cases like appointment reminders, follow-ups, and proactive outreach.

#### 6.2 Requirements

**Must Have:**
- API endpoint to initiate outbound call: `POST /api/calls/outbound`
  - Parameters: agent_id, phone_number, callback_url (optional)
- Agent connects to a LiveKit room and Twilio makes the outbound SIP call
- Call status tracking (ringing, answered, completed, failed, no-answer)
- Outbound call history in call logs

**Must Have (Frontend):**
- "Make a Call" button on agent detail page
- Phone number input with country code
- Call status display during call

#### 6.3 Implementation Notes

- Use Twilio + LiveKit SIP for outbound: Create a SIP participant in the LiveKit room
- LiveKit's `CreateSIPParticipant` API: `lk_api.sip.create_sip_participant(room_name, sip_trunk_id, phone_number)`
- Need a SIP Outbound Trunk configured in LiveKit
- Twilio handles the PSTN leg, LiveKit handles the WebRTC/agent leg

---

### WS-7: Call Transfer (Warm & Cold)

**Priority:** P2
**Estimated Complexity:** Medium

#### 7.1 Requirements

**Must Have:**
- Cold transfer: Agent hangs up, call is forwarded to a number
- Warm transfer: Agent stays on while connecting to the transfer target, then drops

Can be implemented as a built-in function tool (leveraging WS-2):
- `transfer_call(phone_number, type="cold"|"warm")` — built-in function
- Uses Twilio/SIP to connect the existing caller to a new number

---

### WS-8: Embeddable Web Widget

**Priority:** P2
**Estimated Complexity:** Medium

#### 8.1 Requirements

- JavaScript snippet users can embed on their website: `<script src="https://cdn.voxarena.com/widget.js" data-agent="agent-id"></script>`
- Floating chat/call button in bottom-right corner
- Click to start voice conversation (WebRTC)
- Customizable colors, position, branding
- Widget uses the agent's public API key for auth (depends on WS-5)

---

### WS-9: Documentation Site

**Priority:** P1
**Estimated Complexity:** Low-Medium

#### 9.1 Requirements

- Documentation site (Docusaurus, Nextra, or Mintlify)
- Sections: Getting Started, Self-Hosting Guide, API Reference, Agent Configuration, Provider Setup, Webhooks, Function Calling, Telephony, Embedding
- API reference auto-generated from OpenAPI spec (FastAPI provides this)
- Currently `docs.example.com` is a placeholder link in dashboard

---

### WS-10: Cost Tracking & Usage Analytics

**Priority:** P2
**Estimated Complexity:** Medium

#### 10.1 Requirements

- Track per-call costs: STT minutes, LLM tokens, TTS characters
- Provider-specific cost calculation
- Dashboard page showing: total cost, cost per call, cost by provider, cost trends
- Daily/weekly/monthly aggregation

---

## 6. Phase 3: Open-Source Launch

**Duration:** Weeks 6-8
**Goal:** Public launch and community building

### Launch Checklist

- [ ] Clean up repository (remove .env files, add .env.example)
- [ ] Write comprehensive README.md
- [ ] One-command deployment: `docker compose up`
- [ ] LICENSE file (Apache 2.0 or MIT)
- [ ] CONTRIBUTING.md
- [ ] GitHub Issues templates
- [ ] GitHub Actions CI/CD (lint, test, build)
- [ ] Demo video (2-3 minutes)
- [ ] Landing page (voxarena.com)
- [ ] ProductHunt launch
- [ ] HackerNews "Show HN" post
- [ ] Reddit posts (r/selfhosted, r/artificial, r/voiceai)
- [ ] Discord community server
- [ ] YouTube walkthrough video
- [ ] Dev.to / Hashnode blog post
- [ ] Compare page: VoxArena vs Vapi vs Retell

---

## 7. Phase 4: Cloud & Monetization

**Duration:** Months 3-6
**Goal:** Launch hosted cloud version for revenue

### 7.1 VoxArena Cloud

Hosted version at `cloud.voxarena.com`:
- One-click agent creation (no infrastructure setup)
- Managed LiveKit, database, storage
- Usage-based pricing (no per-minute platform tax — differentiation from Vapi/Retell)

### 7.2 Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0/mo | 100 minutes, 2 agents, community support |
| Pro | $49/mo | 2,000 minutes, 10 agents, email support, recording |
| Business | $199/mo | 10,000 minutes, unlimited agents, priority support, SSO |
| Enterprise | Custom | Unlimited, SLA, dedicated support, on-prem option |

### 7.3 Non-Developer Features (Phase 4+)

- Simple Mode toggle (hide technical jargon)
- Onboarding wizard (3-step agent creation)
- Voice preview/playback in voice picker
- Industry templates (Healthcare, Real Estate, E-commerce, etc.)
- Visual conversation flow builder
- Rename: "STT" → "Speech Recognition", "LLM" → "AI Brain", "TTS" → "Voice"

---

## 8. Technical Architecture Reference

### 8.1 System Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  (Next.js)   │     │  (FastAPI)   │     │   Database    │
│  Port: 3000  │     │  Port: 8000  │     │  Port: 5432   │
└──────┬───────┘     └──────┬───────┘     └───────────────┘
       │                    │
       │  WebRTC            │  HTTP/WS
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   LiveKit    │◀────│ Voice Agent  │
│   Server     │     │  (Python)    │
│  (Cloud)     │     │  Worker      │
└──────┬───────┘     └──────────────┘
       │
       │  SIP
       ▼
┌──────────────┐
│   Twilio     │
│   (PSTN)     │
└──────────────┘
```

### 8.2 Voice Pipeline

```
User Speech → [WebRTC/SIP] → LiveKit → STT → Text
                                          ↓
Text → LLM (+ Function Calls) → Response Text
                                          ↓
Response Text → TTS → Audio → LiveKit → [WebRTC/SIP] → User
```

### 8.3 Current Service Stack

| Service | Technology | Port |
|---------|-----------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui | 3000 |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic | 8000 |
| Database | PostgreSQL 15 | 5432 |
| Agent Worker | Python 3.11+, LiveKit Agents SDK | N/A |
| Auth | Clerk (frontend), header-based (backend — needs hardening) | N/A |
| Voice Infra | LiveKit Cloud (WebRTC + SIP) | N/A |
| Telephony | Twilio (SIP trunk + phone numbers) | N/A |
| VAD | Silero (always enabled) | N/A |

### 8.4 Docker Compose Services

```yaml
services:
  postgres:     # PostgreSQL 15 Alpine, health check: pg_isready
  backend:      # FastAPI, depends on postgres(healthy)
  agent:        # LiveKit Agent Worker, depends on backend
  frontend:     # Next.js, depends on backend
volumes:
  postgres_data:
```

---

## 9. Database Schema Reference

### 9.1 Current Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | String(36), PK | UUID |
| clerk_id | String(255), unique, indexed | Clerk auth ID |
| email | String(255), unique | |
| name | String(100), nullable | |
| created_at | DateTime | |
| updated_at | DateTime | |

**agents**
| Column | Type | Notes |
|--------|------|-------|
| id | String(36), PK | UUID |
| name | String(100) | |
| description | Text, nullable | |
| type | Enum(STT, LLM, TTS, PIPELINE) | |
| config | JSON, default {} | Flexible config (see below) |
| is_active | Boolean, default True | Soft delete flag |
| phone_number | String(50), nullable | Twilio number |
| twilio_sid | String(255), nullable | |
| user_id | String(36), FK → users.id | CASCADE delete |
| created_at | DateTime | |
| updated_at | DateTime | |

**voice_sessions**
| Column | Type | Notes |
|--------|------|-------|
| id | String(36), PK | UUID |
| room_name | String(255), unique, indexed | LiveKit room |
| status | Enum(CREATED, ACTIVE, COMPLETED, FAILED) | |
| started_at | DateTime, nullable | |
| ended_at | DateTime, nullable | |
| duration | Integer, nullable | Seconds |
| session_data | JSON, default {} | Metadata + analysis |
| user_id | String(36), FK → users.id | CASCADE delete |
| agent_id | String(36), FK → agents.id, nullable | SET NULL on delete |
| created_at | DateTime | |
| updated_at | DateTime | |

**transcripts**
| Column | Type | Notes |
|--------|------|-------|
| id | String(36), PK | UUID |
| content | Text | Transcript text |
| speaker | Enum(USER, AGENT) | |
| timestamp | DateTime | |
| session_id | String(36), FK → voice_sessions.id | CASCADE delete |

### 9.2 New Tables (Phase 1-2)

**api_keys** (WS-5)
| Column | Type | Notes |
|--------|------|-------|
| id | String(36), PK | UUID |
| user_id | String(36), FK → users.id | CASCADE delete |
| name | String(100) | Display name |
| key_prefix | String(8) | First 8 chars for display |
| key_hash | String(255) | SHA-256 hash of full key |
| scopes | JSON | List of permission scopes |
| last_used_at | DateTime, nullable | |
| expires_at | DateTime, nullable | |
| is_active | Boolean, default True | |
| created_at | DateTime | |

### 9.3 Agent Config JSON Structure (After Phase 1)

```json
{
  "system_prompt": "You are a helpful customer support agent...",
  "first_message": "Hello! How can I help you today?",
  "first_message_mode": "assistant_speaks_first | assistant_waits",

  "llm_provider": "gemini",
  "llm_model": "gemini-2.5-flash | gemini-1.5-flash | gemini-1.5-pro",

  "stt_provider": "deepgram | assemblyai | elevenlabs",

  "voice_id": "resemble-voice-uuid",

  "recording_enabled": true,

  "functions": [
    {
      "id": "uuid",
      "name": "function_name",
      "description": "What this function does",
      "parameters": { "type": "object", "properties": {}, "required": [] },
      "endpoint": {
        "url": "https://...",
        "method": "POST",
        "headers": [{ "key": "Authorization", "value": "Bearer ..." }],
        "timeout": 10
      },
      "speak_during_execution": true,
      "speak_on_send": "Let me check...",
      "speak_on_complete": ""
    }
  ],

  "webhooks": {
    "pre_call": {
      "enabled": false,
      "url": "",
      "method": "GET",
      "timeout": 5,
      "headers": [],
      "assignments": []
    },
    "post_call": {
      "enabled": false,
      "url": "",
      "method": "POST",
      "timeout": 10,
      "headers": [],
      "body": ""
    }
  },

  "template": "blank | support | lead | calendar | form"
}
```

---

## 10. API Reference

### 10.1 Current Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/agents/ | List user's agents | x-user-id header |
| GET | /api/agents/{id} | Get agent by ID | None |
| POST | /api/agents/ | Create agent | user_id in body |
| PATCH | /api/agents/{id} | Update agent | None |
| DELETE | /api/agents/{id} | Soft-delete agent | None |
| GET | /api/sessions/ | List sessions (paginated) | x-user-id header |
| GET | /api/sessions/{id} | Get session | None |
| GET | /api/sessions/{id}/transcripts | Get session transcripts | None |
| POST | /api/sessions/ | Create session | user_id in body |
| PATCH | /api/sessions/{id} | Update session | None |
| POST | /api/sessions/{id}/transcripts | Add transcript | None |
| GET | /api/sessions/by-room/{room} | Get session by room name | None |
| POST | /api/sessions/by-room/{room}/end | End session | None |
| POST | /api/sessions/by-room/{room}/transcripts | Add transcript by room | None |
| POST | /api/livekit/token | Generate LiveKit JWT | None |
| POST | /api/livekit/webhook | LiveKit webhook handler | None |
| GET | /api/telephony/numbers/search | Search Twilio numbers | None |
| POST | /api/telephony/numbers/buy | Buy phone number | None |
| POST | /api/telephony/numbers/release | Release number | None |
| POST | /api/telephony/numbers/assign | Assign number to agent | None |
| GET | /api/telephony/lookup | Lookup agent by phone | None |
| GET | /api/resemble/voices/languages | List TTS languages | None |
| GET | /api/resemble/voices | List TTS voices (paginated) | None |
| GET | /api/resemble/voices/{id} | Get voice by ID | None |

### 10.2 New Endpoints (Phase 1)

| Method | Path | Description | Workstream |
|--------|------|-------------|-----------|
| POST | /api/recordings/start | Start recording for a room | WS-3 |
| POST | /api/recordings/stop | Stop recording for a room | WS-3 |
| GET | /api/sessions/{id}/recording | Get recording URL | WS-3 |
| GET | /api/sessions/{id}/analysis | Get call analysis | WS-4 |

### 10.3 New Endpoints (Phase 2)

| Method | Path | Description | Workstream |
|--------|------|-------------|-----------|
| POST | /api/calls/outbound | Initiate outbound call | WS-6 |
| GET | /api/calls/{id}/status | Get call status | WS-6 |
| POST | /api/keys | Create API key | WS-5 |
| GET | /api/keys | List API keys | WS-5 |
| DELETE | /api/keys/{id} | Revoke API key | WS-5 |

---

## 11. Frontend Reference

### 11.1 Current Pages

| Route | Component | Description |
|-------|-----------|-------------|
| /dashboard | page.tsx (341 lines) | Main dashboard with sidebar, stats, recent calls |
| /dashboard/agents | agents/page.tsx | Agent list with grid cards and create dialog |
| /dashboard/agents/[id] | Dynamic | Agent detail with settings tabs |
| /preview | preview/page.tsx (818 lines) | Browser-based voice testing |
| /sign-in | Clerk | Authentication |
| /sign-up | Clerk | Registration |

### 11.2 Current Components

| Component | Path | Description |
|-----------|------|-------------|
| AgentSettings | components/agents/agent-settings.tsx (~1000 lines) | Tabbed agent config |
| AgentList | components/agents/agent-list.tsx (433 lines) | Agent grid with create dialog |
| AbstractBall | components/preview/ | 3D orb animation (Three.js + GSAP) |

### 11.3 New Pages/Components Needed (Phase 1-2)

| Route/Component | Description | Workstream |
|----------------|-------------|-----------|
| Functions tab in AgentSettings | Function/tool CRUD UI | WS-2 |
| Session detail page | Full session view with transcript + analysis + recording | WS-3, WS-4 |
| Audio player component | Recording playback | WS-3 |
| Analysis display component | Summary, sentiment, topics, outcome | WS-4 |
| /dashboard/api-keys | API key management page | WS-5 |

### 11.4 UI Library

- **Component library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Charts:** Recharts
- **Animations:** GSAP, Three.js
- **Toast:** Sonner
- **Theme:** next-themes (dark mode support)

---

## 12. Environment & Dependencies

### 12.1 Agent Dependencies (`agent/pyproject.toml`)

**Current:**
```
livekit-agents>=0.12.3
livekit-plugins-deepgram>=0.6.0
livekit-plugins-assemblyai>=0.2.0
livekit-plugins-silero>=0.7.0
livekit-plugins-google>=0.9.0
python-dotenv>=1.0.0
httpx>=0.28.0
```

**To Add (Phase 1):**
```
livekit-plugins-elevenlabs>=0.8.0   # WS-1 (ElevenLabs STT)
```

### 12.2 Backend Dependencies (`backend/pyproject.toml`)

**Current:**
```
fastapi>=0.115.0
uvicorn[standard]>=0.34.0
sqlalchemy>=2.0.0
alembic>=1.14.0
psycopg2-binary>=2.9.0
python-dotenv>=1.0.0
pydantic[email]>=2.10.0
pydantic-settings>=2.7.0
livekit-api>=0.8.0
httpx>=0.28.0
twilio>=9.0.0
```

**To Add (Phase 2):**
```
slowapi>=0.1.9           # WS-7 (Rate limiting)
clerk-backend-api>=1.0   # WS-7 (JWT verification)
```

### 12.3 Frontend Dependencies (`frontend/package.json`)

**Current:** Next.js 16, React 19, Clerk, LiveKit components, Radix UI, Recharts, Three.js, GSAP, shadcn/ui, Tailwind CSS 4, Sonner

**To Add (Phase 1-2):** No new frontend dependencies expected — existing UI libraries cover all needs.

### 12.4 Environment Variables

**Current (Agent):**
```env
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=wss://...
DEEPGRAM_API_KEY=
ASSEMBLYAI_API_KEY=
GOOGLE_API_KEY=
RESEMBLE_API_KEY=
RESEMBLE_PROJECT_UUID=
RESEMBLE_VOICE_UUID=
BACKEND_API_URL=http://localhost:8000/api
```

**New (Phase 1 Agent):**
```env
ELEVENLABS_API_KEY=       # WS-1 (ElevenLabs STT)
```

**Current (Backend):**
```env
DATABASE_URL=postgresql://...
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=wss://...
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_SIP_DOMAIN=
RESEMBLE_API_KEY=
PORT=8000
DEBUG=true
FRONTEND_URL=http://localhost:3000
```

**New (Phase 1-2 Backend):**
```env
GOOGLE_API_KEY=           # WS-4 (call analysis via Gemini)
CLERK_SECRET_KEY=         # WS-5 (JWT verification)
RECORDING_STORAGE_PATH=   # WS-3 (local recording storage)
# Or S3-compatible storage:
RECORDING_S3_BUCKET=
RECORDING_S3_REGION=
RECORDING_S3_ACCESS_KEY=
RECORDING_S3_SECRET_KEY=
```

**Current (Frontend):**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=wss://...
GOOGLE_API_KEY=
DEEPGRAM_API_KEY=
RESEMBLE_API_KEY=
RESEMBLE_PROJECT_UUID=
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Appendix A: Workstream Dependency Graph

```
WS-1 (ElevenLabs STT) ─────────────┐
WS-2 (Function Calling) ───────────┤── All independent, can run in parallel
WS-3 (Call Recording) ─────────────┤
WS-4 (End-of-Call Intelligence) ───┘
                                    │
                              Phase 1 Complete
                                    │
WS-5 (Auth) ───────────────────────┤
WS-6 (Outbound Calling) ───────────┤── WS-6, WS-7 depend on telephony (already exists)
WS-7 (Call Transfer) ──────────────┤── WS-7 can leverage WS-2 (function calling)
WS-8 (Widget) ────────────────────┤── WS-8 depends on WS-5 (API keys)
WS-9 (Docs) ──────────────────────┤── Independent
WS-10 (Cost Tracking) ─────────────┘── Independent
```

## Appendix B: Ticket Generation Guide

Each workstream (WS-1 through WS-10) can be broken into tickets:

**Ticket Template:**
```
Title: [WS-X] <action> - <component>
Description: <from the requirements section>
Acceptance Criteria: <from the testing criteria section>
Files to Modify: <from the technical specification>
Dependencies: <from the dependency graph>
Labels: phase-1 | phase-2, priority-P0 | P1 | P2, component-agent | backend | frontend
```

**Example Tickets for WS-2 (Function Calling):**
1. `[WS-2] Add function tool creation logic to agent worker` — agent/agent.py
2. `[WS-2] Add Functions tab to agent settings UI` — agent-settings.tsx
3. `[WS-2] Build parameter schema builder component` — frontend
4. `[WS-2] Add function call logging to transcripts` — agent/agent.py, backend
5. `[WS-2] Add function templates (calendar, CRM, etc.)` — frontend
6. `[WS-2] End-to-end testing: function calling with live agent`

**Example Tickets for WS-1 (ElevenLabs STT):**
1. `[WS-1] Add ElevenLabs STT to agent worker` — agent/agent.py
2. `[WS-1] Add livekit-plugins-elevenlabs dependency` — agent/pyproject.toml
3. `[WS-1] Add ElevenLabs option to STT dropdown` — agent-settings.tsx, preview/page.tsx
4. `[WS-1] Add ELEVENLABS_API_KEY to .env.example` — agent/.env.example

**Suggested Agent Assignment (4-5 agents for Phase 1):**
- Agent 1 → WS-1 (ElevenLabs STT) → then WS-3 (Recording) — STT is small, can combine
- Agent 2 → WS-2 (Function Calling) — most complex, dedicated agent
- Agent 3 → WS-4 (End-of-Call Intelligence)
- Agent 4 → WS-3 (Call Recording) if not combined with Agent 1
- Agent 5 → Integration testing + environment setup + dependency updates

---

*End of PRD — Version 1.1*
