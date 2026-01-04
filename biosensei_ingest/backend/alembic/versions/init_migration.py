"""initial

Revision ID: init123
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'init123'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('telemetry_events',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('inserted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('device_id', sa.Text(), nullable=False),
        sa.Column('source', sa.Text(), nullable=True),
        sa.Column('schema_version', sa.Text(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_telemetry_events_device_id'), 'telemetry_events', ['device_id'], unique=False)
    op.create_index(op.f('ix_telemetry_events_source'), 'telemetry_events', ['source'], unique=False)
    # Index on timestamp desc
    op.create_index('ix_telemetry_events_timestamp_desc', 'telemetry_events', [sa.text('timestamp DESC')], unique=False)


def downgrade() -> None:
    op.drop_index('ix_telemetry_events_timestamp_desc', table_name='telemetry_events')
    op.drop_index(op.f('ix_telemetry_events_source'), table_name='telemetry_events')
    op.drop_index(op.f('ix_telemetry_events_device_id'), table_name='telemetry_events')
    op.drop_table('telemetry_events')
