from fastapi import APIRouter

from app.api.v1.endpoints import alerts, analytics, auth, patients, rules, vitals, audit

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(vitals.router, prefix="/vitals", tags=["vitals"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(rules.router, prefix="/rules", tags=["rules"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
