from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.database import get_db
from app.models import Agent, User
from app.schemas import AgentCreate, AgentUpdate, AgentResponse

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


@router.get("/", response_model=list[AgentResponse])
async def get_agents(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Get all agents for the authenticated user."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    user = db.query(User).filter(User.clerk_id == x_user_id).first()
    if not user:
        return []
    
    agents = db.query(Agent).filter(Agent.user_id == user.id, Agent.is_active == True).order_by(Agent.created_at.desc()).all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get a single agent by ID."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """Create a new agent."""
    user = get_or_create_user(db, agent_data.user_id)
    
    agent = Agent(
        id=str(uuid.uuid4()),
        name=agent_data.name,
        description=agent_data.description,
        type=agent_data.type,
        config=agent_data.config,
        user_id=user.id,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
):
    """Update an agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    update_data = agent_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    """Soft delete an agent (sets is_active to False)."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Soft delete: mark as inactive instead of removing
    agent.is_active = False
    db.commit()
    return None
