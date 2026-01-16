from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
from app.db import models
from app.db.session import get_db
from app.schemas.analytics import PatientAnalytics
from app.services.analytics import compute_patient_analytics
from app.services.audit import log_audit


router = APIRouter()


@router.get("/summary", response_model=PatientAnalytics)
def get_patient_analytics(
    patient_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> dict:
    payload = compute_patient_analytics(db, patient_id)
    log_audit(db, actor=user.username, role=user.role, action="analytics.summary", patient_id=patient_id)
    return payload
