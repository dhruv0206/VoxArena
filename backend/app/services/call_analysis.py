import json
import logging
import os

import httpx

from app.database import SessionLocal
from app.models import VoiceSession, Transcript

logger = logging.getLogger(__name__)

ANALYSIS_PROMPT = """Analyze this voice call transcript and return ONLY a JSON object (no markdown, no code fences) with exactly these fields:
{
  "summary": "2-3 sentence summary of the conversation",
  "sentiment": "positive" or "neutral" or "negative",
  "sentiment_score": 0.0 to 1.0 (1.0 = most positive),
  "topics": ["topic1", "topic2"],
  "outcome": "resolved" or "unresolved" or "transferred" or "escalated",
  "action_items": ["action1", "action2"]
}

Transcript:
{transcript}
"""


async def analyze_call(session_id: str) -> None:
    """Run post-call analysis on a completed session using Google Gemini.

    This function creates its own DB session since it runs as a BackgroundTask
    after the request session has been closed.
    """
    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key:
        logger.warning("GOOGLE_API_KEY not set — skipping call analysis for session %s", session_id)
        return

    db = SessionLocal()
    try:
        session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
        if not session:
            logger.warning("Session %s not found for analysis", session_id)
            return

        transcripts = (
            db.query(Transcript)
            .filter(Transcript.session_id == session_id)
            .order_by(Transcript.timestamp.asc())
            .all()
        )

        if not transcripts:
            logger.info("No transcripts for session %s — skipping analysis", session_id)
            return

        transcript_text = "\n".join(
            f"{'User' if t.speaker.value == 'USER' else 'Agent'}: {t.content}"
            for t in transcripts
        )

        prompt = ANALYSIS_PROMPT.format(transcript=transcript_text)

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
                json={
                    "contents": [
                        {"role": "user", "parts": [{"text": prompt}]}
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                    },
                },
            )
            response.raise_for_status()
            result = response.json()

        raw_text = result["candidates"][0]["content"]["parts"][0]["text"]
        analysis = json.loads(raw_text)

        session.session_data = {
            **(session.session_data or {}),
            "analysis": analysis,
        }
        db.commit()
        logger.info("Call analysis completed for session %s", session_id)

    except Exception:
        logger.exception("Call analysis failed for session %s", session_id)
    finally:
        db.close()
