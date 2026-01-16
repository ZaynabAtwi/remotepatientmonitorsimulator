from typing import Dict, Any, Optional

from sqlalchemy.orm import Session

from app.db import models


def log_audit(
    db: Session,
    actor: str,
    role: str,
    action: str,
    patient_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> models.AuditLog:
    entry = models.AuditLog(
        actor=actor,
        role=role,
        action=action,
        patient_id=patient_id,
        details=details or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
