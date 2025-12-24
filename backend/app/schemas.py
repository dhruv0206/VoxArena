from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models import AgentType, SessionStatus, TranscriptSpeaker


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    clerk_id: str


class UserResponse(UserBase):
    id: str
    clerk_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Agent Schemas
class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: AgentType
    config: dict = {}


class AgentCreate(AgentBase):
    user_id: str


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class AgentResponse(AgentBase):
    id: str
    is_active: bool
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Voice Session Schemas
class VoiceSessionBase(BaseModel):
    room_name: str
    metadata: dict = Field(default={}, alias="session_data")
    
    model_config = {"populate_by_name": True}


class VoiceSessionCreate(VoiceSessionBase):
    user_id: str
    agent_id: Optional[str] = None


class VoiceSessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None
    metadata: Optional[dict] = None


class VoiceSessionResponse(VoiceSessionBase):
    id: str
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration: Optional[int]
    user_id: str
    agent_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Transcript Schemas
class TranscriptBase(BaseModel):
    content: str
    speaker: TranscriptSpeaker


class TranscriptCreate(TranscriptBase):
    session_id: str


class TranscriptResponse(TranscriptBase):
    id: str
    session_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


# LiveKit Schemas
class TokenRequest(BaseModel):
    room_name: str
    user_id: str
    user_name: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    ws_url: str
    room_name: str
