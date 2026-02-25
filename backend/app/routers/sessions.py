from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from decimal import Decimal

from app.database import get_db
from app.config import get_settings
from app.models import VoiceSession, UsageEvent, User, Transcript, SessionStatus, TransferType
from app.schemas import (
    VoiceSessionCreate,
    VoiceSessionUpdate,
    VoiceSessionResponse,
    TranscriptCreate,
    TranscriptCreateByRoom,
    TranscriptResponse,
    SessionCostBreakdownResponse,
    UsageEventResponse,
    TransferRequest,
    TransferResponse,
)
from app.services.call_analysis import analyze_call
from app.services.cost_aggregation import aggregate_session_cost
from app.services.call_transfer import validate_e164, cold_transfer, warm_transfer

router = APIRouter()


def get_or_create_user(db: Session, clerk_id: str) -> User:
    """Get or create a user by Clerk ID."""
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            clerk_id=clerk_id,
            email=f"{clerk_id}@placeholder.com",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/")
async def get_sessions(
    x_user_id: Optional[str] = Header(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=10000),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all sessions for the authenticated user with pagination and date filtering."""
    from datetime import datetime
    
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    user = db.query(User).filter(User.clerk_id == x_user_id).first()
    if not user:
        return {"sessions": [], "total": 0, "page": page, "limit": limit}
    
    # Build query
    query = db.query(VoiceSession).filter(VoiceSession.user_id == user.id)
    
    # Apply date filters (convert to naive UTC for comparison with DB)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            # Convert to naive datetime for comparison with naive DB timestamps
            start_dt = start_dt.replace(tzinfo=None)
            query = query.filter(VoiceSession.created_at >= start_dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            # Convert to naive datetime for comparison with naive DB timestamps
            end_dt = end_dt.replace(tzinfo=None)
            query = query.filter(VoiceSession.created_at <= end_dt)
        except ValueError:
            pass
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    sessions = (
        query
        .order_by(VoiceSession.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    # Build session responses with agent names
    session_responses = []
    for s in sessions:
        response = VoiceSessionResponse.model_validate(s)
        # Populate agent_name from the agent relationship
        if s.agent:
            response.agent_name = s.agent.name
        session_responses.append(response)
    
    return {
        "sessions": session_responses,
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.get("/{session_id}", response_model=VoiceSessionResponse)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get a single session by ID."""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/{session_id}/transcripts", response_model=list[TranscriptResponse])
async def get_session_transcripts(session_id: str, db: Session = Depends(get_db)):
    """Get all transcripts for a session."""
    transcripts = (
        db.query(Transcript)
        .filter(Transcript.session_id == session_id)
        .order_by(Transcript.timestamp.asc())
        .all()
    )
    return transcripts


@router.get("/{session_id}/analysis")
async def get_session_analysis(session_id: str, db: Session = Depends(get_db)):
    """Get call analysis for a session."""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    analysis = (session.session_data or {}).get("analysis")
    return analysis


@router.get("/{session_id}/cost-breakdown", response_model=SessionCostBreakdownResponse)
async def get_session_cost_breakdown(session_id: str, db: Session = Depends(get_db)):
    """Get cost breakdown for a session."""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    events = (
        db.query(UsageEvent)
        .filter(UsageEvent.session_id == session_id)
        .order_by(UsageEvent.created_at.asc())
        .all()
    )

    cost_by_type: dict[str, Decimal] = {}
    for event in events:
        key = event.event_type.value
        cost_by_type[key] = cost_by_type.get(key, Decimal("0")) + event.total_cost

    total_cost = session.total_cost if session.total_cost is not None else sum(cost_by_type.values())

    return SessionCostBreakdownResponse(
        session_id=session_id,
        total_cost=total_cost,
        events=[UsageEventResponse.model_validate(e) for e in events],
        cost_by_type=cost_by_type,
    )


@router.post("/", response_model=VoiceSessionResponse, status_code=201)
async def create_session(
    session_data: VoiceSessionCreate,
    db: Session = Depends(get_db),
):
    """Create a new voice session.
    
    user_id can be either:
    - A Clerk ID (browser sessions): looked up or created via get_or_create_user
    - An internal DB user UUID (SIP sessions): looked up directly by primary key
    """
    from datetime import datetime
    
    incoming_user_id = session_data.user_id
    
    # Check if the incoming user_id is an internal DB UUID (36-char UUID format)
    # vs a Clerk ID (e.g. "user_2abc..." or "sip-caller")
    user = None
    if len(incoming_user_id) == 36 and incoming_user_id.count('-') == 4:
        # Looks like a UUID — try to find the user by internal primary key first
        user = db.query(User).filter(User.id == incoming_user_id).first()
    
    if user is None:
        # Fall back to Clerk ID lookup / creation
        user = get_or_create_user(db, incoming_user_id)
    
    session = VoiceSession(
        id=str(uuid.uuid4()),
        room_name=session_data.room_name,
        user_id=user.id,
        agent_id=session_data.agent_id,
        session_data=session_data.metadata,  # Map metadata to session_data field
        status=SessionStatus.ACTIVE,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.patch("/{session_id}", response_model=VoiceSessionResponse)
async def update_session(
    session_id: str,
    session_data: VoiceSessionUpdate,
    db: Session = Depends(get_db),
):
    """Update a session."""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = session_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    
    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/transcripts", response_model=TranscriptResponse, status_code=201)
async def add_transcript(
    session_id: str,
    transcript_data: TranscriptCreate,
    db: Session = Depends(get_db),
):
    """Add a transcript to a session."""
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    transcript = Transcript(
        id=str(uuid.uuid4()),
        session_id=session_id,
        content=transcript_data.content,
        speaker=transcript_data.speaker,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript


@router.post("/{session_id}/transfer", response_model=TransferResponse)
async def transfer_call(
    session_id: str,
    transfer_data: TransferRequest,
    db: Session = Depends(get_db),
):
    """
    Transfer an active call to another phone number.

    Cold transfer: caller connected to new number, agent disconnected.
    Warm transfer: three-way call (caller + agent + target), agent drops when ready.
    """
    from datetime import datetime

    # Validate E.164 phone number
    if not validate_e164(transfer_data.phone_number):
        raise HTTPException(
            status_code=422,
            detail="Invalid phone number. Must be in E.164 format (e.g. +15551234567)",
        )

    # Look up session
    session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != SessionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Session is not active")

    if session.transferred_to:
        raise HTTPException(status_code=400, detail="Session has already been transferred")

    # Get SIP trunk ID from settings
    settings = get_settings()
    sip_trunk_id = settings.livekit_sip_trunk_id
    if not sip_trunk_id:
        raise HTTPException(status_code=500, detail="SIP trunk not configured")

    # Execute the transfer
    if transfer_data.type == TransferType.COLD:
        result = await cold_transfer(session.room_name, transfer_data.phone_number, sip_trunk_id)
    else:
        result = await warm_transfer(session.room_name, transfer_data.phone_number, sip_trunk_id)

    if not result.success:
        raise HTTPException(status_code=502, detail=result.message)

    # Update session record with transfer details
    session.transferred_to = transfer_data.phone_number
    session.transfer_type = transfer_data.type
    session.transfer_timestamp = datetime.utcnow()
    db.commit()
    db.refresh(session)

    return TransferResponse(
        session_id=session.id,
        transfer_type=transfer_data.type,
        transferred_to=transfer_data.phone_number,
        status="completed" if transfer_data.type == TransferType.COLD else "initiated",
        message=result.message,
    )


@router.get("/by-room/{room_name}", response_model=VoiceSessionResponse)
async def get_session_by_room(room_name: str, db: Session = Depends(get_db)):
    """Get a session by room name."""
    session = db.query(VoiceSession).filter(VoiceSession.room_name == room_name).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/by-room/{room_name}/end", response_model=VoiceSessionResponse)
async def end_session_by_room(
    room_name: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """End a session by room name and calculate duration."""
    from datetime import datetime

    session = db.query(VoiceSession).filter(VoiceSession.room_name == room_name).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Only update if session is still active
    if session.status == SessionStatus.ACTIVE:
        now = datetime.utcnow()
        session.ended_at = now
        session.status = SessionStatus.COMPLETED

        # Calculate duration in seconds
        if session.started_at:
            duration = int((now - session.started_at).total_seconds())
            session.duration = duration

        db.commit()
        db.refresh(session)

        # Trigger post-call analysis and cost aggregation in background (non-blocking)
        background_tasks.add_task(analyze_call, session.id)
        background_tasks.add_task(aggregate_session_cost, session.id)

    return session


@router.post("/by-room/{room_name}/transcripts", response_model=TranscriptResponse, status_code=201)
async def add_transcript_by_room(
    room_name: str,
    transcript_data: TranscriptCreateByRoom,
    db: Session = Depends(get_db),
):
    """Add a transcript to a session using room name."""
    session = db.query(VoiceSession).filter(VoiceSession.room_name == room_name).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    transcript = Transcript(
        id=str(uuid.uuid4()),
        session_id=session.id,
        content=transcript_data.content,
        speaker=transcript_data.speaker,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript


