from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import require_role
from app.db import models
from app.db.session import get_db
from app.schemas.audit import AuditOut


router = APIRouter()


@router.get("/", response_model=List[AuditOut])
def list_audit_logs(
    patient_id: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("admin")),
) -> List[models.AuditLog]:
    query = db.query(models.AuditLog)
    if patient_id:
        query = query.filter(models.AuditLog.patient_id == patient_id)
    return query.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
