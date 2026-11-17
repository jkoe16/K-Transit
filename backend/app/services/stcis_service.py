import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.cache import get_cached, set_cached
from app.services.provider_status import record_provider_status
from app.services.provider_utils import redact_secret

logger = logging.getLogger(__name__)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
STCIS_BASE_URL = "https://stcis.go.kr/openapi"
ENDPOINTS = {
    "regions": "areacode.json",
    "bus_stops": "bussttn.json",
    "route_stops": "rlrdroutesttn.json",
    "quarter_od": "quarterod.json",
}
STATUS_NAMES = {
    "regions": "stcis_regions",
    "bus_stops": "stcis_bus_stops",
    "route_stops": "stcis_bus_routes",
    "quarter_od": "stcis_statistics",
}


async def fetch_stcis(
    resource: str, query: dict[str, str | None]
) -> dict[str, Any]:
    settings = get_settings()
    status_name = STATUS_NAMES[resource]
    if not settings.stcis_api_key:
        record_provider_status(status_name, "key_required")
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
        record_provider_status(
            status_name, "connected", str(cached.get("fetched_at") or "")
        )
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{STCIS_BASE_URL}/{ENDPOINTS[resource]}",
                params=params,
            )
            response.raise_for_status()
            payload = redact_secret(response.json(), settings.stcis_api_key)
    except httpx.TimeoutException as exc:
        record_provider_status(status_name, "error")
        logger.warning("STCIS request timed out for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=504,
            detail="STCIS API 응답이 15초 안에 도착하지 않았습니다.",
        ) from None
    except httpx.HTTPStatusError as exc:
        status = "auth_error" if exc.response.status_code in {401, 403} else "error"
        record_provider_status(
            status_name,
            status,
            http_status=exc.response.status_code,
            response_format="json",
        )
        logger.error("STCIS returned HTTP %s for %s", exc.response.status_code, resource)
        raise HTTPException(
            status_code=502,
            detail=f"STCIS API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except httpx.RequestError as exc:
        record_provider_status(status_name, "error")
        logger.error("STCIS request failed for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail="STCIS API에 연결하지 못했습니다.",
        ) from None
    except ValueError as exc:
        record_provider_status(
            status_name,
            "invalid_response",
            http_status=response.status_code,
            response_format="json",
        )
        logger.error("STCIS returned invalid JSON for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail="STCIS API가 올바른 JSON 응답을 반환하지 않았습니다.",
        ) from None

    if isinstance(payload, dict) and payload.get("status") == "ERROR":
        error = payload.get("error", {})
        message = error.get("text", "STCIS API 오류가 발생했습니다.") if isinstance(error, dict) else "STCIS API 오류가 발생했습니다."
        result_code = error.get("code") if isinstance(error, dict) else None
        record_provider_status(
            status_name,
            "error",
            http_status=response.status_code,
            api_result_code=str(result_code) if result_code is not None else None,
            response_format="json",
        )
        message = str(redact_secret(message, settings.stcis_api_key))
        logger.warning("STCIS API error for %s", resource)
        raise HTTPException(status_code=502, detail=message)

    fetched_at = datetime.now(timezone.utc).isoformat()
    result = {
        "source": "STCIS",
        "resource": resource,
        "fetched_at": fetched_at,
        "cached": False,
        "data": payload,
    }
    record_provider_status(
        status_name,
        "connected",
        fetched_at,
        http_status=response.status_code,
        response_format="json",
    )
    try:
        await set_cached(cache_key, result)
    except Exception as exc:
        logger.error("Configured Redis cache write failed (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다.") from None
    return result
