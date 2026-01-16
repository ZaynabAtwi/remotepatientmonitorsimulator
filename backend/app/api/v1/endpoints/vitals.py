from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
from app.db import models
from app.db.session import get_db
from app.schemas.vital import VitalIngest, VitalOut
from app.services.audit import log_audit
from app.services.events import connection_manager
from app.services.rules_engine import derive_status, evaluate_correlation, evaluate_measurement


router = APIRouter()


@router.post("/ingest")
async def ingest_vitals(
    payload: VitalIngest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> dict:
    patient = db.query(models.Patient).filter(models.Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    ingested = 0
    alerts_generated = 0
    broadcast_alerts: List[models.Alert] = []
    for measurement in payload.measurements:
        status = measurement.status or derive_status(measurement.value, measurement.normal_low, measurement.normal_high)
        alerts = evaluate_measurement(db, payload.patient_id, measurement.metric, measurement.value, measurement.timestamp)
        for alert in alerts:
            db.add(alert)
            alerts_generated += 1
            broadcast_alerts.append(alert)
        if alerts:
            if any(alert.severity == "critical" for alert in alerts):
                status = "critical"
            elif any(alert.severity == "warning" for alert in alerts):
                status = "warning"
        vital = models.VitalSign(
            patient_id=payload.patient_id,
            timestamp=measurement.timestamp,
            metric=measurement.metric,
            value=measurement.value,
            unit=measurement.unit,
            normal_low=measurement.normal_low,
            normal_high=measurement.normal_high,
            status=status,
            source=measurement.source,
        )
        db.add(vital)
        ingested += 1
        correlation_alert = evaluate_correlation(db, payload.patient_id, measurement.timestamp)
        if correlation_alert:
            db.add(correlation_alert)
            alerts_generated += 1
            broadcast_alerts.append(correlation_alert)

        await connection_manager.broadcast(
            {
                "type": "vital",
                "payload": {
                    "patient_id": payload.patient_id,
                    "metric": measurement.metric,
                    "value": measurement.value,
                    "unit": measurement.unit,
                    "timestamp": measurement.timestamp.isoformat(),
                    "status": status,
                },
            }
        )

    db.commit()
    for alert in broadcast_alerts:
        await connection_manager.broadcast(
            {
                "type": "alert",
                "payload": {
                    "id": alert.id,
                    "patient_id": alert.patient_id,
                    "severity": alert.severity,
                    "metric": alert.metric,
                    "timestamp": alert.timestamp.isoformat(),
                    "acknowledged": alert.acknowledged,
                },
            }
        )
    log_audit(db, actor=user.username, role=user.role, action="vitals.ingest", patient_id=payload.patient_id)
    return {"ingested": ingested, "alerts_generated": alerts_generated}


@router.get("/{patient_id}", response_model=List[VitalOut])
def get_vitals(
    patient_id: str,
    metric: Optional[str] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> List[models.VitalSign]:
    query = db.query(models.VitalSign).filter(models.VitalSign.patient_id == patient_id)
    if metric:
        query = query.filter(models.VitalSign.metric == metric)
    if start:
        query = query.filter(models.VitalSign.timestamp >= start)
    if end:
        query = query.filter(models.VitalSign.timestamp <= end)
    vitals = query.order_by(models.VitalSign.timestamp.desc()).limit(limit).all()
    log_audit(db, actor=user.username, role=user.role, action="vitals.get", patient_id=patient_id)
    return vitals
