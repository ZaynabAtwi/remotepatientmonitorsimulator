from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import require_role
from app.db import models
from app.db.session import get_db
from app.schemas.rule import RuleOut
from app.services.rules_engine import load_rules


router = APIRouter()


@router.get("/", response_model=List[RuleOut])
def list_rules(
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role("clinician")),
) -> List[models.RuleDefinition]:
    return load_rules(db)
