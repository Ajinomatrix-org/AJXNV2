import uuid
from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from .db import Base

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inserted_at = Column(DateTime(timezone=True), server_default=func.now())
    timestamp = Column(DateTime(timezone=True), nullable=False)
    device_id = Column(Text, nullable=False)
    source = Column(Text, nullable=True)
    schema_version = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)
