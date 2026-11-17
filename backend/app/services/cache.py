import asyncio
import json
import logging
import time
from typing import Any

from redis.asyncio import Redis

from app.config import get_settings

logger = logging.getLogger(__name__)
_memory_cache: dict[str, tuple[float, str]] = {}
_redis: Redis | None = None
_redis_url: str | None = None
_lock = asyncio.Lock()


async def _get_redis() -> Redis | None:
    global _redis, _redis_url
    url = get_settings().redis_url
    if not url:
        return None
    async with _lock:
        if _redis is None or _redis_url != url:
            if _redis is not None:
                await _redis.aclose()
            _redis = Redis.from_url(url, decode_responses=True)
            _redis_url = url
    return _redis


async def get_cached(key: str) -> dict[str, Any] | None:
    ttl = get_settings().api_cache_ttl_seconds
    if ttl <= 0:
        return None
    redis = await _get_redis()
    if redis is not None:
        try:
            value = await redis.get(key)
        except Exception:
            logger.exception("Redis cache read failed")
            raise
        return json.loads(value) if value else None
    entry = _memory_cache.get(key)
    if entry is None:
        return None
    expires_at, value = entry
    if expires_at <= time.monotonic():
        _memory_cache.pop(key, None)
        return None
    return json.loads(value)


async def set_cached(key: str, value: dict[str, Any]) -> None:
    ttl = get_settings().api_cache_ttl_seconds
    if ttl <= 0:
        return
    encoded = json.dumps(value, ensure_ascii=False)
    redis = await _get_redis()
    if redis is not None:
        try:
            await redis.set(key, encoded, ex=ttl)
        except Exception:
            logger.exception("Redis cache write failed")
            raise
        return
    _memory_cache[key] = (time.monotonic() + ttl, encoded)
