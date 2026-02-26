"""
Configurable cost rates per provider.

Rates are defined here so they can be updated in one place.
The agent worker can also look up rates to calculate total_cost before posting.

Pricing sources (last verified Feb 2026):
- AssemblyAI: $0.47/hr streaming → https://www.assemblyai.com/pricing
- Deepgram:   $0.0077/min streaming PAYG → https://deepgram.com/pricing
- ElevenLabs: $1.00/hr STT API → https://elevenlabs.io/pricing/api
- Gemini 2.5 Flash: $0.30/1M input, $2.50/1M output → https://ai.google.dev/gemini-api/docs/pricing
- Resemble AI: $40/1M chars → https://www.resemble.ai/pricing/
"""
from decimal import Decimal

# STT rates: cost per minute of audio
STT_RATES: dict[str, Decimal] = {
    "deepgram": Decimal("0.0077"),       # $0.46/hr streaming
    "assemblyai": Decimal("0.0078"),     # $0.47/hr streaming
    "elevenlabs": Decimal("0.0167"),     # $1.00/hr API
}

# LLM rates: cost per 1K tokens (blended input+output estimate)
# Gemini 2.5 Flash: $0.30/1M input ($0.0003/1K), $2.50/1M output ($0.0025/1K)
# Blended estimate assumes ~3:1 input:output ratio for voice conversations
LLM_RATES: dict[str, Decimal] = {
    "gemini": Decimal("0.00086"),        # blended ~$0.86/1M tokens
}

# TTS rates: cost per character
TTS_RATES: dict[str, Decimal] = {
    "resemble": Decimal("0.00004"),      # $40/1M characters
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
