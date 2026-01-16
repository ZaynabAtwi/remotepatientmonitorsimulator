from datetime import datetime, timedelta
from statistics import mean, pstdev
from typing import Dict, List

from sqlalchemy.orm import Session

from app.db import models


def _metric_summary(values: List[float]) -> Dict[str, float]:
    if not values:
        return {"avg": 0.0, "min": 0.0, "max": 0.0}
    return {"avg": mean(values), "min": min(values), "max": max(values)}


def compute_risk_score(alerts: List[models.Alert], baseline_risk: str) -> float:
    base = {"low": 0.2, "medium": 0.4, "high": 0.6}.get(baseline_risk, 0.3)
    critical = len([a for a in alerts if a.severity == "critical"])
    warning = len([a for a in alerts if a.severity == "warning"])
    score = base + min(0.4, critical * 0.1) + min(0.2, warning * 0.05)
    return min(1.0, score)


def compute_anomaly_score(values: List[float]) -> float:
    if len(values) < 5:
        return 0.0
    avg = mean(values)
    sd = pstdev(values) or 1.0
    latest = values[-1]
    z = abs((latest - avg) / sd)
    return min(1.0, z / 5)


def compute_patient_analytics(db: Session, patient_id: str) -> Dict:
    lookback = datetime.utcnow() - timedelta(hours=24)
    vitals = (
        db.query(models.VitalSign)
        .filter(models.VitalSign.patient_id == patient_id, models.VitalSign.timestamp >= lookback)
        .all()
    )
    alerts = (
        db.query(models.Alert)
        .filter(models.Alert.patient_id == patient_id, models.Alert.timestamp >= lookback)
        .all()
    )
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    metrics: Dict[str, List[float]] = {}
    for v in vitals:
        metrics.setdefault(v.metric, []).append(v.value)

    summary = {metric: _metric_summary(values) for metric, values in metrics.items()}
    anomaly_score = 0.0
    if metrics:
        anomaly_score = max(compute_anomaly_score(values) for values in metrics.values())

    trend = "stable"
    if len(alerts) >= 3:
        trend = "deteriorating"
    if len([a for a in alerts if a.severity == "critical"]) >= 2:
        trend = "critical"

    return {
        "patient_id": patient_id,
        "risk_score": compute_risk_score(alerts, patient.risk_profile if patient else "medium"),
        "trend": trend,
        "metrics": summary,
        "anomaly_score": anomaly_score,
    }
