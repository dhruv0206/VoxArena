"""
Resemble AI proxy router.

Exposes:
  GET /api/resemble/voices           paginated list, optional ?language= filter
  GET /api/resemble/voices/languages distinct language list (for filter UI)

Results are cached in-process for 5 minutes.

NOTE: The Resemble v2 /voices endpoint does NOT return a `gender` field.
It does return `default_language` as a BCP-47 code (e.g. "en", "sw").
"""

import logging
import time
import httpx
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.config import get_settings

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("resemble-voices")

_CACHE_TTL_SECS = 300  # 5 minutes

# Full normalised voice list (refreshed on first request / expiry)
_all_voices: list[dict] = []
_all_voices_ts: float = 0.0

# Per-(page, page_size, language) page cache
_page_cache: dict[tuple, dict] = {}

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


def _normalise(v: dict) -> dict:
    lang_code = (v.get("default_language") or "").strip()
    language = _LANG_MAP.get(lang_code, lang_code.upper() if lang_code else "Unknown")
    return {
        "id": v.get("uuid", ""),
        "name": v.get("name", "Unknown"),
        "language": language,
        "source": v.get("source", ""),
        "voice_type": v.get("voice_type", ""),
    }


async def _ensure_full_cache() -> list[dict]:
    """Return the full normalised voice list, refreshing if stale."""
    global _all_voices, _all_voices_ts, _page_cache

    now = time.monotonic()
    if _all_voices and (now - _all_voices_ts) < _CACHE_TTL_SECS:
        return _all_voices

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
            voices.extend(data.get("items", []))
            if page >= data.get("num_pages", 1):
                break
            page += 1

    _all_voices = [_normalise(v) for v in voices if v.get("uuid")]
    _all_voices_ts = now
    _page_cache = {}  # invalidate page cache on full refresh
    logger.info(f"[Resemble] Cached {len(_all_voices)} voices")
    return _all_voices


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/voices/languages")
async def list_languages():
    """Return sorted list of distinct language names across all voices."""
    if not settings.resemble_api_key:
        raise HTTPException(status_code=503, detail="RESEMBLE_API_KEY is not configured.")
    try:
        all_v = await _ensure_full_cache()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    langs = sorted({v["language"] for v in all_v if v["language"]})
    return langs


@router.get("/voices")
async def list_voices(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    language: Optional[str] = Query(None, description="Filter by language name"),
):
    """Return a paginated (and optionally language-filtered) list of voices."""
    if not settings.resemble_api_key:
        raise HTTPException(status_code=503, detail="RESEMBLE_API_KEY is not configured.")

    cache_key = (page, page_size, language or "")
    now = time.monotonic()
    cached = _page_cache.get(cache_key)
    if cached and (now - cached["ts"]) < _CACHE_TTL_SECS:
        return cached["data"]

    try:
        all_v = await _ensure_full_cache()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    filtered = [v for v in all_v if not language or v["language"] == language]
    total_count = len(filtered)
    total_pages = max(1, -(-total_count // page_size))  # ceiling division
    start = (page - 1) * page_size
    page_items = filtered[start: start + page_size]

    result = {
        "voices": page_items,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "total_count": total_count,
    }
    _page_cache[cache_key] = {"data": result, "ts": now}
    return result


@router.get("/voices/{voice_id}")
async def get_voice(voice_id: str):
    """Return a single voice by ID from the cache."""
    if not settings.resemble_api_key:
        raise HTTPException(status_code=503, detail="RESEMBLE_API_KEY is not configured.")
    try:
        all_v = await _ensure_full_cache()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    match = next((v for v in all_v if v["id"] == voice_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Voice not found.")
    return match
