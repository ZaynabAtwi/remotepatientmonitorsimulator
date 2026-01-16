from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel


class AuditOut(BaseModel):
    id: int
    actor: str
    role: str
    action: str
    patient_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        orm_mode = True
