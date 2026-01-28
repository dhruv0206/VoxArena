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

from livekit.plugins import assemblyai, deepgram, google, silero

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
    first_message_mode = "assistant_speaks_first"  # or "assistant_waits"
    
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
            first_message_mode = config.get("first_message_mode", "assistant_speaks_first")
            
    # Get STT provider from config (default to assemblyai)
    stt_provider = "assemblyai"
    if agent_config:
        stt_provider = agent_config.get("config", {}).get("stt_provider", "assemblyai")
    
    # Create STT based on provider selection
    if stt_provider == "assemblyai":
        stt = assemblyai.STT()
        logger.info("Using AssemblyAI for STT")
    else:
        stt = deepgram.STT()
        logger.info("Using Deepgram for STT")
    
    # Continue with agent config parsing for webhooks
    if agent_config:
        config = agent_config.get("config", {})
        
        # --- WEBHOOKS SUPPORT ---
        webhooks = config.get("webhooks", {})
        
        # Pre-call Webhook
        pre_call = webhooks.get("pre_call", {})
        if pre_call.get("enabled"):
            logger.info("Executing pre-call webhook...")
            try:
                payload = {
                    "agent_id": agent_id,
                    "room_name": ctx.room.name,
                    "user_id": metadata.get("userId"), # From room metadata
                    "event": "pre_call"
                }
                
                response_data = await execute_webhook(
                    url=pre_call.get("url"),
                    method=pre_call.get("method", "GET"),
                    headers=pre_call.get("headers", []),
                    body=payload if pre_call.get("method") == "POST" else None,
                    timeout=pre_call.get("timeout", 5)
                )
                
                # Handle Assignments
                if response_data and pre_call.get("assignments"):
                    variables = {}
                    for assignment in pre_call.get("assignments", []):
                        # Simple path traversal (e.g. key.subkey)
                        value = response_data
                        for key in assignment["path"].split("."):
                            if isinstance(value, dict):
                                value = value.get(key)
                            else:
                                value = None
                                break
                        if value is not None:
                            variables[assignment["variable"]] = str(value)
                    
                    logger.info(f"Webhook assignments: {variables}")
                    
                    # Apply variables to prompts
                    if variables:
                        try:
                            # Use safe substitution that ignores missing keys
                            for key, val in variables.items():
                                placeholder = "{{" + key + "}}"
                                system_prompt = system_prompt.replace(placeholder, val)
                                first_message = first_message.replace(placeholder, val)
                        except Exception as e:
                            logger.error(f"Error applying webhook variables: {e}")

            except Exception as e:
                logger.error(f"Pre-call webhook failed: {e}")

    # Create TTS with the configured voice
    tts = ResembleTTS(voice_uuid=voice_id) if voice_id else ResembleTTS()
    
    # Create the agent session with STT, LLM, and TTS
    session = AgentSession(
        stt=stt,
        llm=google.LLM(),
        tts=tts,
        vad=silero.VAD.load(),
    )
    
    # Start the session with the configured system prompt
    logger.info(f"Starting session with system_prompt ({len(system_prompt)} chars), first_message_mode={first_message_mode}")
    await session.start(
        room=ctx.room,
        agent=VoiceAssistant(instructions=system_prompt),
    )
    
    # Generate initial greeting only if mode is assistant_speaks_first
    if first_message_mode == "assistant_speaks_first":
        logger.info(f"Generating initial greeting: {first_message}")
        await session.generate_reply(
            instructions=f"Say this exact greeting: {first_message}"
        )
    else:
        logger.info("Assistant waiting for user to speak first")

    # Wait for the session to run until shutdown (disconnection)
    try:
        await ctx.wait_for_shutdown()
    except Exception:
        pass

    # --- POST-CALL WEBHOOK EXECUTION ---
    # This runs after the room is disconnected/shutdown
    if agent_config:
         webhooks = agent_config.get("config", {}).get("webhooks", {})
         post_call = webhooks.get("post_call", {})
         
         if post_call.get("enabled"):
            logger.info("Executing post-call webhook...")
            try:
                # Context variables
                variables = {
                    "agent_id": agent_id,
                    "room_name": ctx.room.name,
                    "user_id": metadata.get("userId") if metadata else None,
                    "reason": "disconnected", # Generic reason as detailed reason might not be available
                }
                
                # Construct body
                body_template = post_call.get("body", "{}")
                body_str = body_template
                for key, val in variables.items():
                    placeholder = "{{" + key + "}}"
                    if body_str:
                        body_str = body_str.replace(placeholder, str(val))
                
                req_body = None
                try:
                    if body_str:
                        req_body = json.loads(body_str)
                    else:
                        req_body = variables # Default payload
                except:
                    req_body = variables

                await execute_webhook(
                    url=post_call.get("url"),
                    method=post_call.get("method", "POST"),
                    headers=post_call.get("headers", []),
                    body=req_body,
                    timeout=post_call.get("timeout", 10)
                )
                logger.info("Post-call webhook executed successfully.")
            except Exception as e:
                logger.error(f"Post-call webhook failed: {e}")

async def execute_webhook(url: str, method: str, headers: list, body: dict | None, timeout: int) -> dict | None:
    """Execute a webhook request."""
    if not url:
        return None
        
    try:
        # Convert list of headers to dict
        header_dict = {h["key"]: h["value"] for h in headers if h["key"]}
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                headers=header_dict,
                json=body,
                timeout=timeout
            )
            response.raise_for_status()
            if response.headers.get("content-type") == "application/json":
                return response.json()
            return None
    except Exception as e:
        logger.error(f"Webhook request failed to {url}: {e}")
        raise e


if __name__ == "__main__":
    agents.cli.run_app(server)
