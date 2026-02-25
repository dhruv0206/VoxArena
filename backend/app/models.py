from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, Integer, Numeric, ForeignKey, Enum, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
import enum
from app.database import Base


class AgentType(enum.Enum):
    STT = "STT"  # Speech to Text
    LLM = "LLM"  # Language Model
    TTS = "TTS"  # Text to Speech
    PIPELINE = "PIPELINE"  # Full pipeline


class SessionStatus(enum.Enum):
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class TranscriptSpeaker(enum.Enum):
    USER = "USER"
    AGENT = "AGENT"


class UsageEventType(enum.Enum):
    STT_MINUTES = "stt_minutes"
    LLM_TOKENS = "llm_tokens"
    TTS_CHARACTERS = "tts_characters"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    agents: Mapped[list["Agent"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions: Mapped[list["VoiceSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[AgentType] = mapped_column(Enum(AgentType))
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Twilio/SIP number
    twilio_sid: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Twilio number SID
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Foreign keys
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="agents")
    sessions: Mapped[list["VoiceSession"]] = relationship(back_populates="agent")


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    room_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.CREATED)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Duration in seconds
    session_data: Mapped[dict] = mapped_column(JSON, default=dict)
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 6), nullable=True)
    cost_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Foreign keys
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    agent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")
    agent: Mapped["Agent | None"] = relationship(back_populates="sessions")
    transcripts: Mapped[list["Transcript"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    usage_events: Mapped[list["UsageEvent"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    content: Mapped[str] = mapped_column(Text)
    speaker: Mapped[TranscriptSpeaker] = mapped_column(Enum(TranscriptSpeaker))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Foreign keys
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("voice_sessions.id", ondelete="CASCADE")
    )

    # Relationships
    session: Mapped["VoiceSession"] = relationship(back_populates="transcripts")


class UsageEvent(Base):
    __tablename__ = "usage_events"
    __table_args__ = (
        Index("ix_usage_events_user_id", "user_id"),
        Index("ix_usage_events_agent_id", "agent_id"),
        Index("ix_usage_events_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    provider: Mapped[str] = mapped_column(String(50))
    event_type: Mapped[UsageEventType] = mapped_column(Enum(UsageEventType))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 8))
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 6))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Foreign keys
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("voice_sessions.id", ondelete="CASCADE")
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE")
    )
    agent_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("agents.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    session: Mapped["VoiceSession"] = relationship(back_populates="usage_events")
    user: Mapped["User"] = relationship()
    agent: Mapped["Agent | None"] = relationship()
