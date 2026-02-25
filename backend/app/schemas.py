from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator
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
    phone_number: Optional[str] = None
    twilio_sid: Optional[str] = None
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
    agent_name: Optional[str] = None  # Added for displaying agent name in UI
    analysis: Optional[dict] = None  # Extracted from session_data["analysis"]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="wrap")
    @classmethod
    def _extract_analysis(cls, data, handler):
        instance = handler(data)
        # Extract analysis from session_data when validating from ORM object
        if hasattr(data, "session_data") and data.session_data:
            instance.analysis = data.session_data.get("analysis")
        elif isinstance(data, dict):
            sd = data.get("session_data") or data.get("metadata") or {}
            if isinstance(sd, dict):
                instance.analysis = sd.get("analysis")
        return instance


# Transcript Schemas
class TranscriptBase(BaseModel):
    content: str
    speaker: TranscriptSpeaker


class TranscriptCreate(TranscriptBase):
    session_id: str


class TranscriptCreateByRoom(TranscriptBase):
    """Transcript creation schema when using room name (session_id derived from room)."""
    pass


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
