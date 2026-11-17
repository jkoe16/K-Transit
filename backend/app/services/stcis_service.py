import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.cache import get_cached, set_cached

logger = logging.getLogger(__name__)
STCIS_BASE_URL = "https://stcis.go.kr/openapi"
ENDPOINTS = {
    "regions": "areacode.json",
    "bus_stops": "bussttn.json",
    "route_stops": "rlrdroutesttn.json",
    "quarter_od": "quarterod.json",
}


async def fetch_stcis(
    resource: str, query: dict[str, str | None]
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.stcis_api_key:
        raise HTTPException(
            status_code=503,
            detail="STCIS API 인증키가 설정되지 않았습니다. backend/.env의 STCIS_API_KEY를 설정하세요.",
        )

    params = {name: value for name, value in query.items() if value is not None}
    params["apikey"] = settings.stcis_api_key
    cache_material = json.dumps(
        {"resource": resource, "params": params},
        sort_keys=True,
        ensure_ascii=True,
    )
    cache_key = "stcis:" + hashlib.sha256(cache_material.encode()).hexdigest()
    try:
        cached = await get_cached(cache_key)
    except Exception as exc:
        logger.error("Configured Redis cache read failed (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다.") from None
    if cached is not None:
        cached["cached"] = True
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{STCIS_BASE_URL}/{ENDPOINTS[resource]}",
                params=params,
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("STCIS returned HTTP %s for %s", exc.response.status_code, resource)
        raise HTTPException(
            status_code=502,
            detail=f"STCIS API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("STCIS request failed for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail="STCIS API 요청에 실패했거나 올바른 JSON 응답을 반환하지 않았습니다.",
        ) from None

    if isinstance(payload, dict) and payload.get("status") == "ERROR":
        error = payload.get("error", {})
        message = error.get("text", "STCIS API 오류가 발생했습니다.") if isinstance(error, dict) else "STCIS API 오류가 발생했습니다."
        message = str(message).replace(settings.stcis_api_key, "[redacted]")
        logger.warning("STCIS API error for %s", resource)
        raise HTTPException(status_code=502, detail=message)

    result = {
        "source": "STCIS",
        "resource": resource,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "cached": False,
        "data": payload,
    }
    try:
        await set_cached(cache_key, result)
    except Exception as exc:
        logger.error("Configured Redis cache write failed (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다.") from None
    return result
