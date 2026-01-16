from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from pathlib import Path

from app.seed import seed_patients, seed_rules, seed_users
from app.services.events import connection_manager


settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_users(db)
        seed_rules(db)
        data_path = Path(__file__).resolve().parents[1] / "data" / "seed_patients.json"
        seed_patients(db, data_path=data_path)
    finally:
        db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket, token: str) -> None:
    try:
        jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError:
        await websocket.close(code=1008)
        return
    await connection_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
