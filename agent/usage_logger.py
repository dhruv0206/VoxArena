"""
Usage event logger for cost tracking.

Sends STT, LLM, and TTS usage events to the backend API.
All logging is fire-and-forget — failures are logged but never crash the call.
"""

import asyncio
import logging
from typing import Any

import httpx

logger = logging.getLogger("usage-logger")


async def log_usage_event(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    event_type: str,
    provider: str,
    usage_data: dict[str, Any],
) -> None:
    """Send a single usage event to the backend. Never raises."""
    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "agent_id": agent_id,
        "event_type": event_type,
        "provider": provider,
        "usage_data": usage_data,
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{backend_url}/usage/events",
                json=payload,
                timeout=5,
            )
            if response.status_code >= 400:
                logger.warning(
                    f"Usage event rejected: {response.status_code} {response.text}"
                )
            else:
                logger.debug(f"Logged {event_type} usage event")
    except Exception as e:
        logger.warning(f"Failed to log {event_type} usage event: {e}")


def log_stt_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    audio_duration: float,
) -> None:
    """Fire-and-forget: log STT minutes after transcription."""
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="stt_minutes",
            provider=provider,
            usage_data={"audio_duration_seconds": audio_duration},
        )
    )


def log_llm_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    input_tokens: int,
    output_tokens: int,
) -> None:
    """Fire-and-forget: log LLM token usage after a response."""
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="llm_tokens",
            provider=provider,
            usage_data={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
            },
        )
    )


def log_tts_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    character_count: int,
) -> None:
    """Fire-and-forget: log TTS character usage after synthesis."""
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="tts_characters",
            provider=provider,
            usage_data={"character_count": character_count},
        )
    )
