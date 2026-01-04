from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Literal
from datetime import datetime

class Metric(BaseModel):
    name: str = Field(..., min_length=1)
    value: float
    unit: Optional[str] = None
    quality: Optional[Literal["ok", "suspect", "bad"]] = None

class IngestPayload(BaseModel):
    schema_version: str = "1.0"
    timestamp: datetime
    device_id: str = Field(..., min_length=1)
    source: Optional[str] = None
    metrics: List[Metric] = Field(..., min_length=1, max_length=50)
    tags: Optional[Dict[str, str]] = None
    note: Optional[str] = None
