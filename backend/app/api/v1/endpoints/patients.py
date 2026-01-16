from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user, require_role
from app.db import models
from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate
from app.services.audit import log_audit


router = APIRouter()


@router.get("/", response_model=List[PatientOut])
def list_patients(
    status: Optional[str] = None,
    risk_profile: Optional[str] = None,
    assigned_clinician: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> List[models.Patient]:
    query = db.query(models.Patient)
    if status:
        query = query.filter(models.Patient.monitoring_status == status)
    if risk_profile:
        query = query.filter(models.Patient.risk_profile == risk_profile)
    if assigned_clinician:
        query = query.filter(models.Patient.assigned_clinician == assigned_clinician)
    patients = query.all()
    log_audit(db, actor=user.username, role=user.role, action="patient.list")
    return patients


@router.post("/", response_model=PatientOut)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("admin")),
) -> models.Patient:
    if db.query(models.Patient).filter(models.Patient.id == payload.id).first():
        raise HTTPException(status_code=409, detail="Patient already exists")
    patient = models.Patient(**payload.dict())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    log_audit(db, actor=user.username, role=user.role, action="patient.create", patient_id=patient.id)
    return patient


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> models.Patient:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    log_audit(db, actor=user.username, role=user.role, action="patient.get", patient_id=patient.id)
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("clinician")),
) -> models.Patient:
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    log_audit(db, actor=user.username, role=user.role, action="patient.update", patient_id=patient.id)
    return patient
