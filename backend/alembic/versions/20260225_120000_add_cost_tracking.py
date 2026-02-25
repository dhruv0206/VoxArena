"""add_cost_tracking

Revision ID: c3f8a2b1d4e6
Revises: a9178a9f9a7b
Create Date: 2026-02-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f8a2b1d4e6'
down_revision: Union[str, None] = 'a9178a9f9a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add cost columns to voice_sessions
    op.add_column('voice_sessions', sa.Column('total_cost', sa.Numeric(12, 6), nullable=True))
    op.add_column('voice_sessions', sa.Column('cost_breakdown', sa.JSON(), nullable=True))

    # Create usage_events table
    op.create_table(
        'usage_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('event_type', sa.Enum('stt_minutes', 'llm_tokens', 'tts_characters', name='usageeventtype'), nullable=False),
        sa.Column('quantity', sa.Numeric(12, 4), nullable=False),
        sa.Column('unit_cost', sa.Numeric(12, 8), nullable=False),
        sa.Column('total_cost', sa.Numeric(12, 6), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('voice_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_id', sa.String(36), sa.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True),
    )

    # Create indexes
    op.create_index('ix_usage_events_user_id', 'usage_events', ['user_id'])
    op.create_index('ix_usage_events_agent_id', 'usage_events', ['agent_id'])
    op.create_index('ix_usage_events_created_at', 'usage_events', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_usage_events_created_at', table_name='usage_events')
    op.drop_index('ix_usage_events_agent_id', table_name='usage_events')
    op.drop_index('ix_usage_events_user_id', table_name='usage_events')
    op.drop_table('usage_events')
    op.execute("DROP TYPE IF EXISTS usageeventtype")
    op.drop_column('voice_sessions', 'cost_breakdown')
    op.drop_column('voice_sessions', 'total_cost')
