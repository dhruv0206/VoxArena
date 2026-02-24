"""
Resemble AI proxy router.

Exposes GET /api/resemble/voices — a lightweight proxy that calls the
Resemble AI REST API and returns available voices for the configured
RESEMBLE_API_KEY. Results are cached in-process for 5 minutes.

NOTE: The Resemble v2 /voices endpoint does NOT return a `gender` field.
It does return `default_language` as a BCP-47 code (e.g. "en", "sw").
"""

import logging
import time
import httpx
from fastapi import APIRouter, HTTPException

from app.config import get_settings

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("resemble-voices")

# ---------------------------------------------------------------------------
# Simple in-process TTL cache
# ---------------------------------------------------------------------------
_voices_cache: list[dict] = []
_cache_ts: float = 0.0
_CACHE_TTL_SECS = 300  # 5 minutes

# BCP-47 code → human-readable language name
_LANG_MAP: dict[str, str] = {
    "en": "English",
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "ru": "Russian",
    "tr": "Turkish",
    "nl": "Dutch",
    "pl": "Polish",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "sw": "Swahili",
    "id": "Indonesian",
    "ms": "Malay",
    "th": "Thai",
    "vi": "Vietnamese",
    "cs": "Czech",
    "sk": "Slovak",
    "ro": "Romanian",
    "hu": "Hungarian",
    "el": "Greek",
    "he": "Hebrew",
    "uk": "Ukrainian",
}


async def _fetch_voices_from_resemble() -> list[dict]:
    """Call Resemble AI and return a flat list of raw voice dicts."""
    if not settings.resemble_api_key:
        return []

    voices: list[dict] = []
    page = 1

    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            resp = await client.get(
                "https://app.resemble.ai/api/v2/voices",
                headers={"Authorization": f"Token {settings.resemble_api_key}"},
                params={"page": page, "page_size": 100},
            )
            if resp.status_code != 200:
                logger.error(f"Resemble API error {resp.status_code}: {resp.text[:300]}")
                break

            data = resp.json()
            items = data.get("items", [])

            if items and not voices:
                logger.info(f"[Resemble] First voice raw: {items[0]}")

            voices.extend(items)

            if page >= data.get("num_pages", 1):
                break
            page += 1

    return voices


def _normalise(v: dict) -> dict:
    """
    Normalise a raw Resemble v2 voice dict.

    Real API fields (as of 2026-02):
      uuid, name, status, default_language ("en", "sw", ...),
      voice_type, voice_status, source

    No 'gender' field is returned by the API.
    """
    lang_code = (v.get("default_language") or "").strip()
    language = _LANG_MAP.get(lang_code, lang_code.upper() if lang_code else "Unknown")

    source = v.get("source", "")
    voice_type = v.get("voice_type", "")

    return {
        "id": v.get("uuid", ""),
        "name": v.get("name", "Unknown"),
        "language": language,
        "source": source,
        "voice_type": voice_type,
    }


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.get("/voices")
async def list_voices():
    """Return available Resemble AI voices for the configured API key."""
    global _voices_cache, _cache_ts

    if not settings.resemble_api_key:
        raise HTTPException(
            status_code=503,
            detail="RESEMBLE_API_KEY is not configured on the server.",
        )

    now = time.monotonic()
    if not _voices_cache or (now - _cache_ts) > _CACHE_TTL_SECS:
        try:
            _voices_cache = await _fetch_voices_from_resemble()
            _cache_ts = now
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch voices from Resemble AI: {exc}",
            )

    return [_normalise(v) for v in _voices_cache if v.get("uuid")]
