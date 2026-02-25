from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.database import get_db
from app.models import UsageEvent, VoiceSession, User
from app.schemas import UsageEventCreate, UsageEventResponse

router = APIRouter()


@router.post("/events", response_model=UsageEventResponse, status_code=201)
async def create_usage_event(
    event_data: UsageEventCreate,
    db: Session = Depends(get_db),
):
    """Log a usage event from the agent worker."""
    # Validate session exists
    session = db.query(VoiceSession).filter(VoiceSession.id == event_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate user exists
    user = db.query(User).filter(User.id == event_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    event = UsageEvent(
        id=str(uuid.uuid4()),
        session_id=event_data.session_id,
        user_id=event_data.user_id,
        agent_id=event_data.agent_id,
        provider=event_data.provider,
        event_type=event_data.event_type,
        quantity=event_data.quantity,
        unit_cost=event_data.unit_cost,
        total_cost=event_data.total_cost,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
