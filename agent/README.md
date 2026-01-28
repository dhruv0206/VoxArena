# VoxArena Voice Agent

A LiveKit-based voice agent using:
- **AssemblyAI** (default) or **Deepgram** for Speech-to-Text
- **Google Gemini** for LLM
- **Google TTS** for Text-to-Speech

## Setup

### 1. Create virtual environment

```bash
cd agent
python -m venv venv

# Windows
.\venv\Scripts\activate

# Unix/Mac
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -e .
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

| Variable | Description | Get from |
|----------|-------------|----------|
| `LIVEKIT_API_KEY` | LiveKit API Key | [cloud.livekit.io](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | [cloud.livekit.io](https://cloud.livekit.io) |
| `LIVEKIT_URL` | LiveKit WebSocket URL | [cloud.livekit.io](https://cloud.livekit.io) |
| `DEEPGRAM_API_KEY` | Deepgram API Key | [console.deepgram.com](https://console.deepgram.com) |
| `GOOGLE_API_KEY` | Google/Gemini API Key | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API Key | [assemblyai.com](https://www.assemblyai.com) |

### 4. Run the agent

Development mode (auto-reload):
```bash
python agent.py dev
```

Production mode:
```bash
python agent.py start
```

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│  AssemblyAI  │────▶│   Gemini    │
│  (Speech)   │     │    (STT)     │     │   (LLM)     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
┌─────────────┐     ┌──────────────┐            │
│   User      │◀────│  Google TTS  │◀───────────┘
│  (Hears)    │     │   (Voice)    │
└─────────────┘     └──────────────┘
```

1. User speaks → AssemblyAI transcribes to text
2. Text → Gemini generates response
3. Response → Google TTS converts to speech
4. User hears the agent's response

## Configuration

### Change LLM Model

```python
llm_instance = google.LLM(
    model="gemini-2.5-flash", 
    temperature=0.7,
)
```

### Change Voice

```python
tts = google.TTS(
    voice="en-US-Journey-F",  # Female voice
    speaking_rate=1.1,        # Slightly faster
)
```

### Change STT Provider

The agent uses AssemblyAI by default. You can configure this in your agent settings or environment variables.

To switch to Deepgram:

```python
# In agent.py
stt = deepgram.STT()
```

Or for AssemblyAI (default):

```python
# In agent.py
stt = assemblyai.STT()
```

## Deployment

For production, deploy the agent to a server and run:

```bash
python agent.py start --log-level info
```

Or use Docker:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -e .
CMD ["python", "agent.py", "start"]
```
