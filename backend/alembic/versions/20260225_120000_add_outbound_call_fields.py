"""add_outbound_call_fields

Revision ID: b3c7e1a2d4f6
Revises: a9178a9f9a7b
Create Date: 2026-02-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3c7e1a2d4f6'
down_revision: Union[str, None] = 'a9178a9f9a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types first
    call_direction_enum = sa.Enum('INBOUND', 'OUTBOUND', name='calldirection')
    call_status_enum = sa.Enum('RINGING', 'ANSWERED', 'COMPLETED', 'FAILED', 'NO_ANSWER', name='callstatus')
    call_direction_enum.create(op.get_bind(), checkfirst=True)
    call_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('voice_sessions', sa.Column('call_direction', call_direction_enum, nullable=True))
    op.add_column('voice_sessions', sa.Column('outbound_phone_number', sa.String(length=50), nullable=True))
    op.add_column('voice_sessions', sa.Column('call_status', call_status_enum, nullable=True))
    op.add_column('voice_sessions', sa.Column('callback_url', sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column('voice_sessions', 'callback_url')
    op.drop_column('voice_sessions', 'call_status')
    op.drop_column('voice_sessions', 'outbound_phone_number')
    op.drop_column('voice_sessions', 'call_direction')

    # Drop enum types
    sa.Enum(name='callstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='calldirection').drop(op.get_bind(), checkfirst=True)
