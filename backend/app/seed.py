import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db import models


def seed_users(db: Session) -> None:
    if db.query(models.User).count() > 0:
        return
    users = [
        models.User(
            username="admin",
            full_name="System Admin",
            role="admin",
            hashed_password=get_password_hash("admin123"),
        ),
        models.User(
            username="clinician1",
            full_name="Dr. Nina Santos",
            role="clinician",
            hashed_password=get_password_hash("demo123"),
        ),
        models.User(
            username="simulator",
            full_name="Simulator Service",
            role="admin",
            hashed_password=get_password_hash("simulator123"),
        ),
    ]
    db.add_all(users)
    db.commit()


def seed_patients(db: Session, data_path: Path) -> None:
    if db.query(models.Patient).count() > 0:
        return
    patients = json.loads(data_path.read_text())
    for patient in patients:
        db.add(models.Patient(**patient))
    db.commit()


def seed_rules(db: Session) -> None:
    if db.query(models.RuleDefinition).count() > 0:
        return
    from app.services.rules_engine import DEFAULT_RULES

    for rule in DEFAULT_RULES:
        db.add(models.RuleDefinition(**rule))
    db.commit()
