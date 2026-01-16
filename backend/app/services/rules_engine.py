from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.db import models


DEFAULT_RULES = [
    {"name": "Tachycardia Warning", "metric": "heart_rate", "operator": ">", "threshold": 110, "severity": "warning"},
    {"name": "Tachycardia Critical", "metric": "heart_rate", "operator": ">", "threshold": 130, "severity": "critical"},
    {"name": "Hypoxemia Warning", "metric": "spo2", "operator": "<", "threshold": 92, "severity": "warning"},
    {"name": "Hypoxemia Critical", "metric": "spo2", "operator": "<", "threshold": 88, "severity": "critical"},
    {"name": "Hypertension Warning", "metric": "bp_systolic", "operator": ">", "threshold": 140, "severity": "warning"},
    {"name": "Hypertension Critical", "metric": "bp_systolic", "operator": ">", "threshold": 160, "severity": "critical"},
    {"name": "Diastolic Warning", "metric": "bp_diastolic", "operator": ">", "threshold": 90, "severity": "warning"},
    {"name": "Fever Warning", "metric": "temperature", "operator": ">", "threshold": 37.8, "severity": "warning"},
    {"name": "Fever Critical", "metric": "temperature", "operator": ">", "threshold": 39.0, "severity": "critical"},
    {"name": "Tachypnea Warning", "metric": "respiratory_rate", "operator": ">", "threshold": 22, "severity": "warning"},
    {"name": "Tachypnea Critical", "metric": "respiratory_rate", "operator": ">", "threshold": 28, "severity": "critical"},
    {"name": "Hyperglycemia Warning", "metric": "blood_glucose", "operator": ">", "threshold": 180, "severity": "warning"},
    {"name": "Hyperglycemia Critical", "metric": "blood_glucose", "operator": ">", "threshold": 250, "severity": "critical"},
]


def _compare(value: float, operator: str, threshold: float) -> bool:
    if operator == ">":
        return value > threshold
    if operator == "<":
        return value < threshold
    if operator == ">=":
        return value >= threshold
    if operator == "<=":
        return value <= threshold
    return False


def load_rules(db: Session) -> List[models.RuleDefinition]:
    rules = db.query(models.RuleDefinition).filter(models.RuleDefinition.enabled.is_(True)).all()
    if rules:
        return rules
    for rule in DEFAULT_RULES:
        db.add(models.RuleDefinition(**rule))
    db.commit()
    return db.query(models.RuleDefinition).filter(models.RuleDefinition.enabled.is_(True)).all()


def evaluate_measurement(
    db: Session,
    patient_id: str,
    metric: str,
    value: float,
    timestamp: datetime,
) -> List[models.Alert]:
    alerts: List[models.Alert] = []
    rules = [rule for rule in load_rules(db) if rule.metric == metric]
    for rule in rules:
        if _compare(value, rule.operator, rule.threshold):
            severity = rule.severity
            trigger_rule = rule.name
            if severity == "warning":
                recent = (
                    db.query(models.Alert)
                    .filter(
                        models.Alert.patient_id == patient_id,
                        models.Alert.metric == metric,
                        models.Alert.severity == "warning",
                        models.Alert.timestamp >= timestamp - timedelta(minutes=30),
                    )
                    .count()
                )
                if recent >= 2:
                    severity = "critical"
                    trigger_rule = f"{rule.name} (escalated)"
            alert = models.Alert(
                patient_id=patient_id,
                metric=metric,
                severity=severity,
                trigger_rule=trigger_rule,
                timestamp=timestamp,
                acknowledged=False,
            )
            alerts.append(alert)
    return alerts


def evaluate_correlation(
    db: Session,
    patient_id: str,
    timestamp: datetime,
) -> Optional[models.Alert]:
    window_start = timestamp - timedelta(minutes=10)
    recent = (
        db.query(models.VitalSign)
        .filter(
            models.VitalSign.patient_id == patient_id,
            models.VitalSign.timestamp >= window_start,
        )
        .all()
    )
    metrics = {v.metric: v.value for v in recent}
    if metrics.get("heart_rate", 0) > 120 and metrics.get("spo2", 100) < 90:
        return models.Alert(
            patient_id=patient_id,
            metric="multi_metric",
            severity="critical",
            trigger_rule="Tachycardia + Hypoxemia Correlation",
            timestamp=timestamp,
            acknowledged=False,
        )
    return None


def derive_status(value: float, normal_low: Optional[float], normal_high: Optional[float]) -> str:
    if normal_low is not None and value < normal_low:
        return "warning"
    if normal_high is not None and value > normal_high:
        return "warning"
    return "normal"
