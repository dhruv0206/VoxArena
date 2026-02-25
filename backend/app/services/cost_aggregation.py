"""Aggregate usage_events costs into voice_sessions on session end."""
import logging
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from app.database import SessionLocal
from app.models import UsageEvent, VoiceSession

logger = logging.getLogger(__name__)


def aggregate_session_cost(session_id: str) -> None:
    """Sum all usage_events for a session and update voice_sessions.total_cost + cost_breakdown.

    Runs as a background task after session ends.
    """
    db: DBSession = SessionLocal()
    try:
        session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
        if not session:
            logger.warning("aggregate_session_cost: session %s not found", session_id)
            return

        events = db.query(UsageEvent).filter(UsageEvent.session_id == session_id).all()
        if not events:
            session.total_cost = Decimal("0")
            session.cost_breakdown = {}
            db.commit()
            return

        total = Decimal("0")
        by_type: dict[str, Decimal] = defaultdict(Decimal)
        by_provider: dict[str, Decimal] = defaultdict(Decimal)

        for event in events:
            total += event.total_cost
            by_type[event.event_type.value] += event.total_cost
            by_provider[event.provider] += event.total_cost

        session.total_cost = total
        session.cost_breakdown = {
            "by_type": {k: str(v) for k, v in by_type.items()},
            "by_provider": {k: str(v) for k, v in by_provider.items()},
        }
        db.commit()
        logger.info(
            "Aggregated cost for session %s: $%s", session_id, total
        )
    except Exception:
        logger.exception("Error aggregating cost for session %s", session_id)
        db.rollback()
    finally:
        db.close()
