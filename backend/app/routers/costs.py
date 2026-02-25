from datetime import datetime
from decimal import Decimal
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import UsageEvent, VoiceSession, Agent, User
from app.schemas import (
    CostSummaryResponse,
    TimelinePointResponse,
    AgentCostResponse,
    SessionCostBreakdownResponse,
    UsageEventResponse,
)

router = APIRouter()


def _resolve_user(db: Session, clerk_id: str) -> User | None:
    return db.query(User).filter(User.clerk_id == clerk_id).first()


@router.get("/summary", response_model=CostSummaryResponse)
async def get_cost_summary(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Total cost, this month's cost, and cost broken down by provider."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    user = _resolve_user(db, x_user_id)
    if not user:
        return CostSummaryResponse(
            total_cost=Decimal("0"), this_month_cost=Decimal("0"), by_provider={}
        )

    # Total cost (all time)
    total_row = (
        db.query(func.coalesce(func.sum(UsageEvent.total_cost), 0))
        .filter(UsageEvent.user_id == user.id)
        .scalar()
    )
    total_cost = Decimal(str(total_row))

    # This month
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_row = (
        db.query(func.coalesce(func.sum(UsageEvent.total_cost), 0))
        .filter(UsageEvent.user_id == user.id, UsageEvent.created_at >= month_start)
        .scalar()
    )
    this_month_cost = Decimal(str(month_row))

    # By provider
    provider_rows = (
        db.query(UsageEvent.provider, func.sum(UsageEvent.total_cost))
        .filter(UsageEvent.user_id == user.id)
        .group_by(UsageEvent.provider)
        .all()
    )
    by_provider = {row[0]: Decimal(str(row[1])) for row in provider_rows}

    return CostSummaryResponse(
        total_cost=total_cost,
        this_month_cost=this_month_cost,
        by_provider=by_provider,
    )


@router.get("/timeline", response_model=list[TimelinePointResponse])
async def get_cost_timeline(
    x_user_id: Optional[str] = Header(None),
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Cost over time, grouped by day/week/month."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    user = _resolve_user(db, x_user_id)
    if not user:
        return []

    query = db.query(
        cast(UsageEvent.created_at, Date).label("date"),
        UsageEvent.provider,
        func.sum(UsageEvent.total_cost).label("cost"),
    ).filter(UsageEvent.user_id == user.id)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(UsageEvent.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00")).replace(tzinfo=None)
            query = query.filter(UsageEvent.created_at <= end_dt)
        except ValueError:
            pass

    rows = (
        query.group_by(cast(UsageEvent.created_at, Date), UsageEvent.provider)
        .order_by(cast(UsageEvent.created_at, Date))
        .all()
    )

    # Aggregate by date
    timeline: dict[str, dict[str, Decimal]] = defaultdict(lambda: defaultdict(Decimal))
    for date_val, provider, cost in rows:
        date_str = str(date_val)
        timeline[date_str][provider] += Decimal(str(cost))

    result = []
    for date_str in sorted(timeline.keys()):
        by_provider = dict(timeline[date_str])
        total = sum(by_provider.values())
        result.append(
            TimelinePointResponse(date=date_str, total_cost=total, by_provider=by_provider)
        )

    return result


@router.get("/by-agent", response_model=list[AgentCostResponse])
async def get_cost_by_agent(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Cost aggregated per agent."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")

    user = _resolve_user(db, x_user_id)
    if not user:
        return []

    rows = (
        db.query(
            UsageEvent.agent_id,
            func.sum(UsageEvent.total_cost).label("total_cost"),
            func.count(func.distinct(UsageEvent.session_id)).label("session_count"),
            func.count(UsageEvent.id).label("event_count"),
        )
        .filter(UsageEvent.user_id == user.id, UsageEvent.agent_id.isnot(None))
        .group_by(UsageEvent.agent_id)
        .all()
    )

    result = []
    for agent_id, total_cost, session_count, event_count in rows:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        agent_name = agent.name if agent else "Unknown"
        result.append(
            AgentCostResponse(
                agent_id=agent_id,
                agent_name=agent_name,
                total_cost=Decimal(str(total_cost)),
                session_count=session_count,
                event_count=event_count,
            )
        )

    return result
