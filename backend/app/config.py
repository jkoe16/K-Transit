import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    stcis_api_key: str = os.getenv("STCIS_API_KEY", "").strip()
    redis_url: str = os.getenv("REDIS_URL", "").strip()
    api_cache_ttl_seconds: int = max(0, int(os.getenv("API_CACHE_TTL_SECONDS", "60")))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
