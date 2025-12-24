"""
VoxArena Voice Agent

A LiveKit-based voice agent using:
- Deepgram for Speech-to-Text
- Google Gemini for LLM
- Resemble AI for Text-to-Speech
"""

import logging
import os

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession
from livekit.plugins import deepgram, google, silero

from resemble_tts import ResembleTTS

load_dotenv()
logger = logging.getLogger("voice-agent")


class VoiceAssistant(Agent):
    """Custom voice assistant agent."""
    
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful and witty voice assistant called VoxArena Assistant. 
You are interfacing with the user via a voice channel. 
Keep your responses concise and engaging.
Do not use complex formatting, emojis, or special characters in your responses.
Speak naturally as if having a conversation.""",
        )


# Create the agent server
server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the voice agent session."""
    
    logger.info(f"Starting voice agent session for room: {ctx.room.name}")
    
    # Create the agent session with STT, LLM, and TTS
    session = AgentSession(
        stt=deepgram.STT(),
        llm=google.LLM(),
        tts=ResembleTTS(),
        vad=silero.VAD.load(),
    )
    
    # Start the session
    await session.start(
        room=ctx.room,
        agent=VoiceAssistant(),
    )
    
    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user warmly and offer your assistance. Keep it brief and friendly."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
