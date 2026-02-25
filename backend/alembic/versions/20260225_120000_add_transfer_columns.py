"""add_transfer_columns

Revision ID: b3f7c2e1d4a6
Revises: a9178a9f9a7b
Create Date: 2026-02-25 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3f7c2e1d4a6'
down_revision: Union[str, None] = 'a9178a9f9a7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('voice_sessions', sa.Column('transferred_to', sa.String(length=50), nullable=True))
    op.add_column('voice_sessions', sa.Column('transfer_type', sa.Enum('WARM', 'COLD', name='transfertype'), nullable=True))
    op.add_column('voice_sessions', sa.Column('transfer_timestamp', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('voice_sessions', 'transfer_timestamp')
    op.drop_column('voice_sessions', 'transfer_type')
    op.drop_column('voice_sessions', 'transferred_to')
    # Drop the enum type
    sa.Enum(name='transfertype').drop(op.get_bind(), checkfirst=True)
