import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    full_name = Column(String(128), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="clinician")
    is_active = Column(Boolean, default=True)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(16), nullable=False)
    height_cm = Column(Float, nullable=False)
    weight_kg = Column(Float, nullable=False)
    diagnoses = Column(JSONB, nullable=False, default=list)
    risk_profile = Column(String(32), nullable=False)
    assigned_clinician = Column(String(64), nullable=True)
    monitoring_status = Column(String(32), nullable=False, default="active")
    baseline_profile = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    vitals = relationship("VitalSign", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")


class VitalSign(Base):
    __tablename__ = "vital_signs"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    metric = Column(String(32), nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String(16), nullable=False)
    normal_low = Column(Float, nullable=True)
    normal_high = Column(Float, nullable=True)
    status = Column(String(16), nullable=False)
    source = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="vitals")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String(32), ForeignKey("patients.id"), nullable=False, index=True)
    metric = Column(String(32), nullable=False)
    severity = Column(String(16), nullable=False)
    trigger_rule = Column(String(128), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    acknowledged = Column(Boolean, default=False)
    clinician_notes = Column(Text, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="alerts")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(64), nullable=False)
    role = Column(String(32), nullable=False)
    action = Column(String(128), nullable=False)
    patient_id = Column(String(32), nullable=True, index=True)
    details = Column(JSONB, nullable=True, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)


class RuleDefinition(Base):
    __tablename__ = "rule_definitions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    metric = Column(String(32), nullable=False)
    operator = Column(String(8), nullable=False)
    threshold = Column(Float, nullable=False)
    severity = Column(String(16), nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


Index("ix_vitals_patient_metric_time", VitalSign.patient_id, VitalSign.metric, VitalSign.timestamp)
