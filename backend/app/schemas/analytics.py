from typing import Dict, Optional

from pydantic import BaseModel


class MetricSummary(BaseModel):
    avg: float
    min: float
    max: float


class PatientAnalytics(BaseModel):
    patient_id: str
    risk_score: float
    trend: str
    metrics: Dict[str, MetricSummary]
    anomaly_score: Optional[float] = None
