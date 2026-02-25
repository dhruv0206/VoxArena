"""
Calls Router - Outbound calling via LiveKit SIP.
Handles initiating outbound phone calls and tracking call status.
"""

import asyncio
import logging
import re
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import (
    Agent,
    CallDirection,
    CallStatus,
    SessionStatus,
    User,
    VoiceSession,
)
from app.schemas import CallStatusResponse, OutboundCallRequest, OutboundCallResponse

logger = logging.getLogger("calls")
router = APIRouter()

E164_PATTERN = re.compile(r"^\+[1-9]\d{1,14}$")


def _validate_e164(phone_number: str) -> str:
    """Validate and return an E.164-formatted phone number."""
    phone = phone_number.strip()
    if not E164_PATTERN.match(phone):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid phone number format: '{phone}'. Must be E.164 (e.g. +15551234567).",
        )
    return phone


async def _timeout_no_answer(session_id: str, timeout_seconds: int = 60) -> None:
    """Background task: mark call as NO_ANSWER if still RINGING after timeout."""
    await asyncio.sleep(timeout_seconds)

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
        if session and session.call_status == CallStatus.RINGING:
            session.call_status = CallStatus.NO_ANSWER
            session.status = SessionStatus.FAILED
            session.ended_at = datetime.utcnow()
            db.commit()
            logger.info(f"Call {session_id} timed out — marked as NO_ANSWER")
    except Exception:
        logger.exception(f"Error in timeout handler for call {session_id}")
    finally:
        db.close()


@router.post("/outbound", response_model=OutboundCallResponse, status_code=201)
async def create_outbound_call(
    request: OutboundCallRequest,
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
):
    """Initiate an outbound phone call via LiveKit SIP.

    Creates a voice session, a LiveKit room, and dials the phone number.
    """
    settings = get_settings()

    # --- Validate inputs ---
    phone = _validate_e164(request.phone_number)

    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(status_code=500, detail="LiveKit not configured")

    if not settings.livekit_url:
        raise HTTPException(status_code=500, detail="LiveKit URL not configured")

    # --- Authenticate user ---
    user = db.query(User).filter(User.clerk_id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # --- Validate agent belongs to user ---
    agent = (
        db.query(Agent)
        .filter(
            Agent.id == request.agent_id,
            Agent.user_id == user.id,
            Agent.is_active == True,
        )
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or does not belong to user")

    # --- Create voice session ---
    session_id = str(uuid.uuid4())
    room_name = f"outbound-{session_id[:8]}"

    session = VoiceSession(
        id=session_id,
        room_name=room_name,
        user_id=user.id,
        agent_id=agent.id,
        status=SessionStatus.ACTIVE,
        call_direction=CallDirection.OUTBOUND,
        outbound_phone_number=phone,
        call_status=CallStatus.RINGING,
        callback_url=request.callback_url,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # --- Create LiveKit room & dial via SIP ---
    try:
        from livekit import api as lk_api
        from livekit.protocol.sip import CreateSIPParticipantRequest

        livekit = lk_api.LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        )

        # Create room first
        from livekit.protocol.room import CreateRoomRequest

        await livekit.room.create_room(
            CreateRoomRequest(name=room_name, empty_timeout=120)
        )

        # Dial the phone number via SIP
        sip_request = CreateSIPParticipantRequest(
            sip_trunk_id=settings.twilio_sip_domain,  # Outbound trunk ID
            sip_call_to=phone,
            room_name=room_name,
            participant_identity=f"phone-{phone}",
            participant_name=f"Phone {phone}",
            play_dialtone=True,
        )

        await livekit.sip.create_sip_participant(sip_request)
        await livekit.aclose()

    except Exception as e:
        # Mark session as failed if SIP call initiation fails
        session.call_status = CallStatus.FAILED
        session.status = SessionStatus.FAILED
        session.ended_at = datetime.utcnow()
        db.commit()
        logger.error(f"Failed to initiate outbound call: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to initiate call: {str(e)}")

    # --- Schedule no-answer timeout (60 seconds) ---
    background_tasks.add_task(_timeout_no_answer, session_id, 60)

    return OutboundCallResponse(
        call_id=session.id,
        room_name=session.room_name,
        status=session.call_status,
    )


@router.get("/{call_id}/status", response_model=CallStatusResponse)
async def get_call_status(
    call_id: str,
    db: Session = Depends(get_db),
):
    """Get the current status of a call."""
    session = db.query(VoiceSession).filter(VoiceSession.id == call_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Call not found")

    return CallStatusResponse(
        call_id=session.id,
        status=session.status,
        call_status=session.call_status,
        call_direction=session.call_direction,
        outbound_phone_number=session.outbound_phone_number,
        room_name=session.room_name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration=session.duration,
    )
