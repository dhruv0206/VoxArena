from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database import get_db
from app.models import VoiceSession, User, Transcript, SessionStatus
from app.schemas import (
    VoiceSessionCreate,
    VoiceSessionUpdate,
    VoiceSessionResponse,
    TranscriptCreate,
    TranscriptResponse,
)

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


@router.get("/", response_model=list[VoiceSessionResponse])
async def get_sessions(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Get all sessions for the authenticated user."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    user = db.query(User).filter(User.clerk_id == x_user_id).first()
    if not user:
        return []
    
    sessions = (
        db.query(VoiceSession)
        .filter(VoiceSession.user_id == user.id)
        .order_by(VoiceSession.created_at.desc())
        .limit(50)
        .all()
    )
    return sessions


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


@router.post("/", response_model=VoiceSessionResponse, status_code=201)
async def create_session(
    session_data: VoiceSessionCreate,
    db: Session = Depends(get_db),
):
    """Create a new voice session."""
    from datetime import datetime
    
    user = get_or_create_user(db, session_data.user_id)
    
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
