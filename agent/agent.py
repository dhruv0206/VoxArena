"""
VoxArena Voice Agent

A LiveKit-based voice agent using:
- Deepgram for Speech-to-Text
- Google Gemini for LLM
- Resemble AI for Text-to-Speech
"""

import json
import logging
import os

import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession

from livekit.plugins import deepgram, google, silero

from resemble_tts import ResembleTTS

load_dotenv()
logger = logging.getLogger("voice-agent")

# Backend API URL
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000/api")

# Default system prompt if no agent config found
DEFAULT_INSTRUCTIONS = """You are a helpful and witty voice assistant called VoxArena Assistant. 
You are interfacing with the user via a voice channel. 
Keep your responses concise and engaging.
Do not use complex formatting, emojis, or special characters in your responses.
Speak naturally as if having a conversation."""


async def fetch_agent_config(agent_id: str) -> dict | None:
    """Fetch agent configuration from the backend API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BACKEND_API_URL}/agents/{agent_id}")
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Failed to fetch agent config: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching agent config: {e}")
        return None


class VoiceAssistant(Agent):
    """Custom voice assistant agent."""
    
    def __init__(self, instructions: str = DEFAULT_INSTRUCTIONS) -> None:
        super().__init__(
            instructions=instructions,
        )


# Create the agent server
server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the voice agent session."""
    
    logger.info(f"Starting voice agent session for room: {ctx.room.name}")
    
    # Wait for room to be fully connected
    await ctx.connect()
    logger.info("Room connected, reading metadata...")
    
    # Get agent ID from room metadata
    room_metadata = ctx.room.metadata
    logger.info(f"Room metadata: {room_metadata}")
    
    # Parse room metadata to get agent configuration
    agent_id = None
    agent_config = None
    voice_id = None
    system_prompt = DEFAULT_INSTRUCTIONS
    first_message = "Hello! How can I help you today?"
    
    # Parse room metadata to get agent ID
    if room_metadata:
        try:
            metadata = json.loads(room_metadata)
            agent_id = metadata.get("agentId")
            logger.info(f"Found agent ID in room metadata: {agent_id}")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse room metadata: {e}")
    
    # Fetch agent config if we have an agent ID
    if agent_id and agent_id != "default":
        agent_config = await fetch_agent_config(agent_id)
        if agent_config:
            logger.info(f"Full agent config: {agent_config}")
            config = agent_config.get("config", {})
            system_prompt = config.get("system_prompt") or DEFAULT_INSTRUCTIONS
            first_message = config.get("first_message") or first_message
            voice_id = config.get("voice_id")
            logger.info(f"Using agent config: voice_id={voice_id}, first_message={first_message[:50] if first_message else 'None'}...")
        else:
            logger.warning(f"Could not fetch agent config for agent_id: {agent_id}")
    else:
        logger.info(f"No valid agent_id found, using defaults. agent_id={agent_id}")
    
    # Create TTS with the configured voice
    tts = ResembleTTS(voice_uuid=voice_id) if voice_id else ResembleTTS()
    
    # Create the agent session with STT, LLM, and TTS
    session = AgentSession(
        stt=deepgram.STT(),
        llm=google.LLM(),
        tts=tts,
        vad=silero.VAD.load(),
    )
    
    # Start the session with the configured system prompt
    await session.start(
        room=ctx.room,
        agent=VoiceAssistant(instructions=system_prompt),
    )
    
    # Generate initial greeting
    await session.generate_reply(
        instructions=f"Say this exact greeting: {first_message}"
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
