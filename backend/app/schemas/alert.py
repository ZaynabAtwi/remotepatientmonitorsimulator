from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AlertOut(BaseModel):
    id: str
    patient_id: str
    metric: str
    severity: str
    trigger_rule: str
    timestamp: datetime
    acknowledged: bool
    clinician_notes: Optional[str] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class AlertAcknowledge(BaseModel):
    clinician_note: Optional[str] = None
