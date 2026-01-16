from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    name: str
    age: int
    sex: str
    height_cm: float
    weight_kg: float
    diagnoses: List[str]
    risk_profile: str
    assigned_clinician: Optional[str] = None
    monitoring_status: str = "active"
    baseline_profile: Dict[str, Any] = Field(default_factory=dict)


class PatientCreate(PatientBase):
    id: str


class PatientUpdate(BaseModel):
    monitoring_status: Optional[str] = None
    assigned_clinician: Optional[str] = None
    risk_profile: Optional[str] = None
    baseline_profile: Optional[Dict[str, Any]] = None


class PatientOut(PatientBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True
