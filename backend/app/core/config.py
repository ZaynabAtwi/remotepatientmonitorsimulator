from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    app_name: str = "RPM Simulator API"
    environment: str = Field("development", env="ENVIRONMENT")
    api_v1_prefix: str = "/api/v1"
    secret_key: str = Field("dev_secret_key_change_me", env="SECRET_KEY")
    access_token_expire_minutes: int = 60 * 12
    database_url: str = Field(
        "postgresql+psycopg2://rpm:rpm@localhost:5432/rpm_simulator",
        env="DATABASE_URL",
    )
    cors_origins: str = Field("*", env="CORS_ORIGINS")

    class Config:
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
