import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    stcis_api_key: str = os.getenv("STCIS_API_KEY", "").strip()
    tago_api_key: str = os.getenv("TAGO_API_KEY", "").strip()
    klid_api_key: str = os.getenv("KLID_API_KEY", "").strip()
    seoul_api_key: str = os.getenv("SEOUL_API_KEY", "").strip()
    busan_api_key: str = os.getenv("BUSAN_API_KEY", "").strip()
    incheon_api_key: str = os.getenv("INCHEON_API_KEY", "").strip()
    daegu_api_key: str = os.getenv("DAEGU_API_KEY", "").strip()
    daejeon_api_key: str = os.getenv("DAEJEON_API_KEY", "").strip()
    keco_api_key: str = os.getenv("KECO_API_KEY", "").strip()
    daejeon_metro_api_key: str = os.getenv("DAEJEON_METRO_API_KEY", "").strip()
    redis_url: str = os.getenv("REDIS_URL", "").strip()
    traffic_api_key: str = os.getenv("TRAFFIC_API_KEY", "").strip()
    api_cache_ttl_seconds: int = max(0, int(os.getenv("API_CACHE_TTL_SECONDS", "60")))
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,https://jkoe16.github.io",
        ).split(",")
        if origin.strip()
    ]
