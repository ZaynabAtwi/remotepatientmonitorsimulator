from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user, require_role
from app.db import models
from app.db.session import get_db
from app.schemas.alert import AlertAcknowledge, AlertOut
from app.services.audit import log_audit
from app.services.events import connection_manager


router = APIRouter()


@router.get("/", response_model=List[AlertOut])
def list_alerts(
    patient_id: Optional[str] = None,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> List[models.Alert]:
    query = db.query(models.Alert)
    if patient_id:
        query = query.filter(models.Alert.patient_id == patient_id)
    if severity:
        query = query.filter(models.Alert.severity == severity)
    if acknowledged is not None:
        query = query.filter(models.Alert.acknowledged.is_(acknowledged))
    alerts = query.order_by(models.Alert.timestamp.desc()).all()
    log_audit(db, actor=user.username, role=user.role, action="alerts.list", patient_id=patient_id)
    return alerts


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledge,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("clinician")),
) -> models.Alert:
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    alert.clinician_notes = payload.clinician_note
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    log_audit(db, actor=user.username, role=user.role, action="alerts.acknowledge", patient_id=alert.patient_id)
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
    return alert
