from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite+aiosqlite:///./assetflow.db"
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_EMAIL: str = "admin@assetflow.com"
    ADMIN_PASSWORD: str = "Admin@1234"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
