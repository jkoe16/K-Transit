"""국토교통부(TAGO) 공공데이터 프록시.

주의: 아래 서비스 경로·오퍼레이션 이름·요청변수는 공식 포털(data.go.kr) 명세를
이 저장소에서 직접 대조하지 못한 상태로 작성되었습니다(미검증). 실제 인증키로
응답을 확인한 뒤 이 주석을 제거하세요. STCIS와 마찬가지로 응답은 내부 스키마로
변환하지 않고 원본 JSON을 그대로 전달합니다.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import unquote

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.cache import get_cached, set_cached

logger = logging.getLogger(__name__)
TAGO_BASE_URL = "https://apis.data.go.kr/1613000"

# resource 이름 -> (서비스 경로, 오퍼레이션)
OPERATIONS: dict[str, tuple[str, str]] = {
    "subway_stations": ("SubwayInfo", "getKwrdFndSubwaySttnList"),
    "subway_timetable": ("SubwayInfo", "getSubwaySttnAcctoSchdulList"),
    "bus_arrivals": ("ArvlInfoInqireService", "getSttnAcctoArvlPrearngeInfoList"),
}

# 포털은 resultCode "00"을 정상으로 반환한다.
SUCCESS_CODE = "00"


def require_verified_operation(feature: str = "TAGO 지하철정보") -> None:
    raise HTTPException(
        status_code=501,
        detail=f"{feature} API 명세는 확인되었으며, 현재 애플리케이션에는 아직 연동되지 않았습니다.",
    )


def _service_key(raw_key: str) -> str:
    # 포털에서 복사한 인코딩 키(%2B 등)를 넣어도 httpx가 다시 인코딩하며 깨지지 않도록
    # 한 번 디코딩한 값을 전달한다.
    return unquote(raw_key)


def _redact(text: str, key: str) -> str:
    for secret in {key, _service_key(key)}:
        if secret:
            text = text.replace(secret, "[redacted]")
    return text


async def fetch_tago(
    resource: str, query: dict[str, str | int | None]
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.tago_api_key:
        raise HTTPException(
            status_code=503,
            detail="TAGO API 인증키가 설정되지 않았습니다. 백엔드 환경변수 TAGO_API_KEY를 설정하세요.",
        )

    service, operation = OPERATIONS[resource]
    params: dict[str, str | int] = {
        name: value for name, value in query.items() if value is not None
    }
    params["_type"] = "json"
    cache_material = json.dumps(
        {"resource": resource, "params": params}, sort_keys=True, ensure_ascii=True
    )
    cache_key = "tago:" + hashlib.sha256(cache_material.encode()).hexdigest()
    try:
        cached = await get_cached(cache_key)
    except Exception as exc:
        logger.error("Configured Redis cache read failed (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="설정된 Redis 캐시에 연결할 수 없습니다.") from None
    if cached is not None:
        cached["cached"] = True
        return cached

    request_params = {**params, "serviceKey": _service_key(settings.tago_api_key)}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{TAGO_BASE_URL}/{service}/{operation}", params=request_params
            )
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as exc:
        logger.error("TAGO returned HTTP %s for %s", exc.response.status_code, resource)
        raise HTTPException(
            status_code=502,
            detail=f"TAGO API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except (httpx.HTTPError, ValueError) as exc:
        logger.error("TAGO request failed for %s (%s)", resource, type(exc).__name__)
        raise HTTPException(
            status_code=502,
            detail=(
                "TAGO API 요청에 실패했거나 JSON이 아닌 응답을 반환했습니다. "
                "인증키 등록 상태와 서비스 활용 신청 여부를 확인하세요."
            ),
        ) from None

    header = (
        payload.get("response", {}).get("header", {}) if isinstance(payload, dict) else {}
    )
    result_code = str(header.get("resultCode", SUCCESS_CODE))
    if result_code != SUCCESS_CODE:
        message = _redact(
            str(header.get("resultMsg", "TAGO API 오류가 발생했습니다.")),
            settings.tago_api_key,
        )
        logger.warning("TAGO API error %s for %s", result_code, resource)
        raise HTTPException(status_code=502, detail=f"TAGO 오류({result_code}): {message}")

    result = {
        "source": "TAGO",
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
