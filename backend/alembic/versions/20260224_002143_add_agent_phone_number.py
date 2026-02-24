"""add_agent_phone_number

Revision ID: a9178a9f9a7b
Revises: 9a38246ce4d8
Create Date: 2026-02-24 00:21:43.671335

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9178a9f9a7b'
down_revision: Union[str, None] = '9a38246ce4d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agents', sa.Column('phone_number', sa.String(length=50), nullable=True))
    op.add_column('agents', sa.Column('twilio_sid', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('agents', 'twilio_sid')
    op.drop_column('agents', 'phone_number')
