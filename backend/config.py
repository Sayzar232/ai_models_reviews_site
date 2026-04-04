from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_review_hub"
    SECRET_KEY: str = "super-secret-key-change-me-in-production"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours
    CORS_ORIGINS: str = "http://localhost:8000,http://localhost:3000"
    LOGO_DEV_TOKEN: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
