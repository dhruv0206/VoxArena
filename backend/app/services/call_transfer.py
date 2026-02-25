"""
Call Transfer Service — handles warm and cold call transfers via LiveKit SIP.

Cold transfer: Create outbound SIP call to target, disconnect agent from room.
Warm transfer: Create outbound SIP call to target, keep all three participants on call.
"""

import logging
import re
from dataclasses import dataclass

from livekit import api
from livekit.protocol.sip import CreateSIPParticipantRequest, TransferSIPParticipantRequest
from livekit.protocol.room import RoomParticipantIdentity, ListParticipantsRequest

from app.config import get_settings

logger = logging.getLogger("call_transfer")

# E.164 regex: + followed by 1-15 digits
E164_PATTERN = re.compile(r"^\+[1-9]\d{1,14}$")


def validate_e164(phone_number: str) -> bool:
    """Validate that a phone number is in E.164 format."""
    return bool(E164_PATTERN.match(phone_number))


@dataclass
class TransferResult:
    success: bool
    message: str


async def _get_livekit_api() -> api.LiveKitAPI:
    """Create a LiveKit API client from settings."""
    settings = get_settings()
    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise RuntimeError("LiveKit credentials not configured")
    return api.LiveKitAPI(
        url=settings.livekit_url,
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    )


async def _find_sip_participant(lk: api.LiveKitAPI, room_name: str) -> str | None:
    """Find the SIP participant identity in a room (the phone caller)."""
    resp = await lk.room.list_participants(
        ListParticipantsRequest(room=room_name)
    )
    for p in resp.participants:
        # SIP participants have identities starting with "sip_" or contain "sip"
        # in their metadata, or have a phone-number-like identity
        if (
            p.identity.startswith("sip_")
            or "sip" in (p.metadata or "").lower()
            or p.identity.startswith("+")
        ):
            return p.identity
    return None


async def _find_agent_participant(lk: api.LiveKitAPI, room_name: str) -> str | None:
    """Find the agent participant identity in a room."""
    resp = await lk.room.list_participants(
        ListParticipantsRequest(room=room_name)
    )
    for p in resp.participants:
        # Agent participants typically have "agent" in identity
        if "agent" in p.identity.lower():
            return p.identity
    return None


async def cold_transfer(room_name: str, phone_number: str, sip_trunk_id: str) -> TransferResult:
    """
    Cold transfer: Transfer the SIP caller to a new number and disconnect the agent.

    1. Find the SIP participant in the room
    2. Transfer the SIP participant to the target number
    3. Remove the agent from the room
    """
    lk = await _get_livekit_api()
    try:
        # Find SIP participant
        sip_identity = await _find_sip_participant(lk, room_name)
        if not sip_identity:
            return TransferResult(success=False, message="No SIP participant found in room")

        # Transfer the SIP call to the target number
        try:
            await lk.sip.transfer_sip_participant(
                TransferSIPParticipantRequest(
                    participant_identity=sip_identity,
                    room_name=room_name,
                    transfer_to=phone_number,
                    play_dialtone=True,
                )
            )
        except Exception as e:
            logger.error(f"SIP transfer failed: {e}")
            return TransferResult(
                success=False,
                message=f"Transfer failed: target may be unreachable ({e})",
            )

        # Disconnect the agent
        agent_identity = await _find_agent_participant(lk, room_name)
        if agent_identity:
            try:
                await lk.room.remove_participant(
                    RoomParticipantIdentity(room=room_name, identity=agent_identity)
                )
            except Exception as e:
                logger.warning(f"Failed to remove agent from room: {e}")

        return TransferResult(success=True, message="Cold transfer completed successfully")
    finally:
        await lk.aclose()


async def warm_transfer(room_name: str, phone_number: str, sip_trunk_id: str) -> TransferResult:
    """
    Warm transfer: Add the target as a new SIP participant in the room.

    Creates a three-way call: caller + agent + transfer target.
    The agent can drop when ready via the normal session end flow.
    """
    lk = await _get_livekit_api()
    try:
        # Verify SIP caller is in the room
        sip_identity = await _find_sip_participant(lk, room_name)
        if not sip_identity:
            return TransferResult(success=False, message="No SIP participant found in room")

        # Create outbound SIP call to target and add them to the same room
        try:
            await lk.sip.create_sip_participant(
                CreateSIPParticipantRequest(
                    sip_trunk_id=sip_trunk_id,
                    sip_call_to=phone_number,
                    room_name=room_name,
                    participant_identity=f"transfer_{phone_number}",
                    participant_name=f"Transfer: {phone_number}",
                    play_dialtone=True,
                    krisp_enabled=True,
                    wait_until_answered=True,
                )
            )
        except Exception as e:
            logger.error(f"Failed to create outbound SIP call: {e}")
            return TransferResult(
                success=False,
                message=f"Transfer failed: target may be unreachable ({e})",
            )

        return TransferResult(success=True, message="Warm transfer initiated — three-way call active")
    finally:
        await lk.aclose()
