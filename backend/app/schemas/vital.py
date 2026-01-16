from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class VitalMeasurement(BaseModel):
    timestamp: datetime
    metric: str
    value: float
    unit: str
    normal_low: Optional[float] = None
    normal_high: Optional[float] = None
    status: Optional[str] = None
    source: str


class VitalIngest(BaseModel):
    patient_id: str
    measurements: List[VitalMeasurement]


class VitalOut(VitalMeasurement):
    id: int
    patient_id: str

    class Config:
        orm_mode = True
