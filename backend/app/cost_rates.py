"""
Configurable cost rates per provider.

Rates are defined here so they can be updated in one place.
The agent worker can also look up rates to calculate total_cost before posting.
"""
from decimal import Decimal

# STT rates: cost per minute
STT_RATES: dict[str, Decimal] = {
    "deepgram": Decimal("0.0043"),
    "assemblyai": Decimal("0.0085"),
    "elevenlabs": Decimal("0.0069"),
}

# LLM rates: cost per 1K tokens
LLM_RATES: dict[str, Decimal] = {
    "gemini": Decimal("0.000075"),
}

# TTS rates: cost per character
TTS_RATES: dict[str, Decimal] = {
    "resemble": Decimal("0.0003"),
}

# Unified lookup: event_type → { provider → rate }
COST_RATES: dict[str, dict[str, Decimal]] = {
    "stt_minutes": STT_RATES,
    "llm_tokens": LLM_RATES,
    "tts_characters": TTS_RATES,
}


def get_unit_cost(event_type: str, provider: str) -> Decimal | None:
    """Look up the unit cost for a given event type and provider.

    Returns None if the provider/event_type combination is unknown.
    For llm_tokens, the rate is per 1K tokens — callers should divide
    quantity by 1000 when computing total_cost.
    """
    rates = COST_RATES.get(event_type)
    if rates is None:
        return None
    return rates.get(provider.lower())
