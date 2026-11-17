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
TAGO_BASE_URL = "https://apis.data.go.kr/1613000/ArvlInfoInqireService"
ENDPOINTS = {
    "bus_arrivals": "getSttnAcctoArvlPrearngeInfoList",
    "arrival_cities": "getCtyCodeList",
}
STATUS_NAMES = {
    "bus_arrivals": "bus_arrivals",
    "arrival_cities": "bus_arrival_cities",
}


async def fetch_tago(
    resource: str, query: dict[str, str | int | None]
) -> dict[str, Any]:
    settings = get_settings()
    status_name = STATUS_NAMES[resource]
    if not settings.tago_api_key:
        record_provider_status(status_name, "key_required")
        raise HTTPException(
            status_code=503,
            detail="TAGO API 인증키가 설정되지 않았습니다. backend/.env의 TAGO_API_KEY를 설정하세요.",
        )

    params: dict[str, str | int] = {
        name: value for name, value in query.items() if value is not None
    }
    params.update({"serviceKey": settings.tago_api_key, "_type": "json"})
    cache_material = json.dumps(
        {"resource": resource, "params": params},
        sort_keys=True,
        ensure_ascii=True,
    )
    cache_key = "tago:" + hashlib.sha256(cache_material.encode()).hexdigest()
    try:
        cached = await get_cached(cache_key)
    except Exception as exc:
        logger.error("Configured Redis cache read failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다."
        ) from None
    if cached is not None:
        cached["cached"] = True
        record_provider_status(
            status_name, "connected", str(cached.get("fetched_at") or "")
        )
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{TAGO_BASE_URL}/{ENDPOINTS[resource]}",
                params=params,
            )
            response.raise_for_status()
            payload = redact_secret(response.json(), settings.tago_api_key)
    except httpx.TimeoutException as exc:
        record_provider_status(status_name, "error")
        logger.warning("TAGO request timed out for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=504, detail="TAGO API 응답이 15초 안에 도착하지 않았습니다."
        ) from None
    except httpx.HTTPStatusError as exc:
        status = "auth_error" if exc.response.status_code in {401, 403} else "error"
        record_provider_status(
            status_name,
            status,
            http_status=exc.response.status_code,
            response_format="json",
        )
        logger.error("TAGO returned HTTP %s for %s", exc.response.status_code, resource)
        raise HTTPException(
            status_code=502,
            detail=f"TAGO API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except httpx.RequestError as exc:
        record_provider_status(status_name, "error")
        logger.error("TAGO request failed for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="TAGO API에 연결하지 못했습니다."
        ) from None
    except ValueError as exc:
        record_provider_status(
            status_name,
            "invalid_response",
            http_status=response.status_code,
            response_format="json",
        )
        logger.error("TAGO returned invalid JSON for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="TAGO API가 올바른 JSON 응답을 반환하지 않았습니다."
        ) from None

    header = _provider_header(payload)
    if header is None or "resultCode" not in header:
        record_provider_status(
            status_name,
            "invalid_response",
            http_status=response.status_code,
            response_format="json",
        )
        raise HTTPException(
            status_code=502,
            detail="TAGO API 응답에서 문서에 명시된 resultCode를 확인할 수 없습니다.",
        )

    error = _provider_error(payload, settings.tago_api_key)
    if error:
        record_provider_status(
            status_name,
            "error",
            http_status=response.status_code,
            api_result_code=str(header["resultCode"]),
            response_format="json",
        )
        logger.warning("TAGO API error for %s", resource)
        raise HTTPException(status_code=502, detail=error)

    record_count = _item_count(payload)
    fetched_at = datetime.now(timezone.utc).isoformat()
    result = {
        "source": "TAGO",
        "resource": resource,
        "fetched_at": fetched_at,
        "cached": False,
        "data": payload,
    }
    result_code = str(header["resultCode"])
    record_provider_status(
        status_name,
        "no_data" if record_count == 0 else "connected",
        fetched_at,
        http_status=response.status_code,
        api_result_code=result_code,
        response_format="json",
        record_count=record_count,
    )
    try:
        await set_cached(cache_key, result)
    except Exception as exc:
        logger.error("Configured Redis cache write failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다."
        ) from None
    return result


def _provider_error(payload: Any, api_key: str) -> str | None:
    header = _provider_header(payload)
    if header is None or "resultCode" not in header:
        return None
    if str(header["resultCode"]) in {"00", "0"}:
        return None
    message = header.get("resultMsg", "TAGO API 오류가 발생했습니다.")
    return str(redact_secret(message, api_key))


def _provider_header(payload: Any) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None
    response = payload.get("response")
    header = response.get("header") if isinstance(response, dict) else None
    return header if isinstance(header, dict) else None


def _item_count(payload: Any) -> int | None:
    if not isinstance(payload, dict):
        return None
    response = payload.get("response")
    body = response.get("body") if isinstance(response, dict) else None
    if isinstance(body, dict) and body.get("totalCount") is not None:
        try:
            return int(body["totalCount"])
        except (TypeError, ValueError):
            return None
    items = body.get("items") if isinstance(body, dict) else None
    if not isinstance(items, dict) or "item" not in items:
        return None
    item = items["item"]
    if item is None:
        return 0
    return len(item) if isinstance(item, list) else 1


def require_verified_operation(feature: str = "TAGO 지하철정보") -> None:
    raise HTTPException(
        status_code=501,
        detail=f"{feature} API 명세는 확인되었으며, 현재 애플리케이션에는 아직 연동되지 않았습니다.",
    )
