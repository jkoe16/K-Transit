import hashlib
import json
import logging
import math
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.services.cache import get_cached, set_cached
from app.services.provider_status import record_provider_status
from app.services.provider_utils import redact_secret

logger = logging.getLogger(__name__)
ITS_TRAFFIC_URL = "https://openapi.its.go.kr:9443/trafficInfo"
ITS_EVENT_URL = "https://openapi.its.go.kr:9443/eventInfo"
SERVICE_NAME = "its_traffic_speed"
EVENT_SERVICE_NAME = "its_traffic_events"


async def fetch_traffic_speed(
    query: dict[str, str | float],
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.traffic_api_key:
        record_provider_status(SERVICE_NAME, "key_required")
        raise HTTPException(
            status_code=503,
            detail=(
                "ITS 교통소통 API 키가 설정되지 않았습니다. "
                "backend/.env의 TRAFFIC_API_KEY를 설정하세요."
            ),
        )

    params: dict[str, str | float] = {
        **query,
        "apiKey": settings.traffic_api_key,
    }
    cache_material = json.dumps(
        {"params": params},
        sort_keys=True,
        ensure_ascii=True,
    )
    cache_key = "its-traffic:" + hashlib.sha256(cache_material.encode()).hexdigest()

    try:
        cached = await get_cached(cache_key)
    except Exception as exc:
        logger.error("ITS cache read failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="교통정보 캐시를 조회할 수 없습니다."
        ) from None
    if cached is not None:
        cached["cached"] = True
        record_provider_status(
            SERVICE_NAME,
            "connected",
            str(cached.get("fetched_at") or ""),
        )
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(ITS_TRAFFIC_URL, params=params)
            response.raise_for_status()
            payload = redact_secret(response.json(), settings.traffic_api_key)
    except httpx.TimeoutException as exc:
        record_provider_status(
            SERVICE_NAME, "error", last_error="ITS 요청 시간 초과"
        )
        logger.warning("ITS traffic request timed out (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=504, detail="ITS API 응답이 15초 안에 도착하지 않았습니다."
        ) from None
    except httpx.HTTPStatusError as exc:
        status = "auth_error" if exc.response.status_code in {401, 403} else "error"
        record_provider_status(
            SERVICE_NAME,
            status,
            last_error=f"ITS HTTP {exc.response.status_code}",
            http_status=exc.response.status_code,
            response_format="json",
        )
        logger.error("ITS returned HTTP %s", exc.response.status_code)
        raise HTTPException(
            status_code=502,
            detail=f"ITS API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except httpx.RequestError as exc:
        record_provider_status(
            SERVICE_NAME, "error", last_error="ITS 연결 실패"
        )
        logger.error("ITS request failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="ITS API에 연결하지 못했습니다."
        ) from None
    except ValueError as exc:
        record_provider_status(
            SERVICE_NAME,
            "invalid_response",
            last_error="ITS 응답 JSON 파싱 실패",
            http_status=response.status_code,
            response_format="json",
        )
        logger.error("ITS returned invalid JSON (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="ITS API가 유효한 JSON 응답을 반환하지 않았습니다."
        ) from None

    if not isinstance(payload, dict) or "resultCode" not in payload:
        record_provider_status(
            SERVICE_NAME,
            "invalid_response",
            last_error="ITS 응답 필드 확인 필요",
            http_status=response.status_code,
            response_format="json",
        )
        raise HTTPException(
            status_code=502,
            detail="ITS API 응답에서 문서에 명시된 resultCode를 확인할 수 없습니다.",
        )
    if str(payload["resultCode"]) != "0":
        message = str(payload.get("resultMsg") or "ITS API 요청 실패")
        message = str(redact_secret(message, settings.traffic_api_key))
        result_code = str(payload["resultCode"])
        status = "auth_error" if result_code == "4005" else "error"
        record_provider_status(
            SERVICE_NAME,
            status,
            last_error=message,
            http_status=response.status_code,
            api_result_code=result_code,
            response_format="json",
        )
        raise HTTPException(status_code=502, detail=message)

    total_count = payload.get("totalCount")
    try:
        record_count = int(total_count) if total_count is not None else None
    except (TypeError, ValueError):
        record_count = None
    fetched_at = datetime.now(timezone.utc).isoformat()
    result = {
        "source": "국가교통정보센터 ITS",
        "resource": "traffic_speed",
        "fetched_at": fetched_at,
        "cached": False,
        "data": payload,
    }
    record_provider_status(
        SERVICE_NAME,
        "no_data" if record_count == 0 else "connected",
        fetched_at,
        http_status=response.status_code,
        api_result_code=str(payload["resultCode"]),
        response_format="json",
        record_count=record_count,
    )
    try:
        await set_cached(cache_key, result)
    except Exception as exc:
        logger.error("ITS cache write failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="교통정보 캐시를 저장할 수 없습니다."
        ) from None
    return result


async def fetch_traffic_incidents(
    query: dict[str, str | float],
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.traffic_api_key:
        record_provider_status(EVENT_SERVICE_NAME, "key_required")
        raise HTTPException(
            status_code=503,
            detail=(
                "ITS 돌발상황 API 키가 설정되지 않았습니다. "
                "backend/.env의 TRAFFIC_API_KEY를 설정하세요."
            ),
        )

    params: dict[str, str | float] = {
        **query,
        "apiKey": settings.traffic_api_key,
    }
    cache_material = json.dumps(
        {"params": params},
        sort_keys=True,
        ensure_ascii=True,
    )
    cache_key = "its-events:" + hashlib.sha256(cache_material.encode()).hexdigest()

    try:
        cached = await get_cached(cache_key)
    except Exception as exc:
        logger.error("ITS event cache read failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="돌발정보 캐시를 조회할 수 없습니다."
        ) from None
    if cached is not None:
        cached["cached"] = True
        record_provider_status(
            EVENT_SERVICE_NAME,
            "connected",
            str(cached.get("fetched_at") or ""),
        )
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(ITS_EVENT_URL, params=params)
            response.raise_for_status()
            root = ET.fromstring(response.content)
    except httpx.TimeoutException as exc:
        record_provider_status(
            EVENT_SERVICE_NAME, "error", last_error="ITS 요청 시간 초과"
        )
        logger.warning("ITS event request timed out (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=504, detail="ITS API 응답이 15초 안에 도착하지 않았습니다."
        ) from None
    except httpx.HTTPStatusError as exc:
        status = "auth_error" if exc.response.status_code in {401, 403} else "error"
        record_provider_status(
            EVENT_SERVICE_NAME,
            status,
            last_error=f"ITS HTTP {exc.response.status_code}",
            http_status=exc.response.status_code,
            response_format="xml",
        )
        logger.error("ITS event API returned HTTP %s", exc.response.status_code)
        raise HTTPException(
            status_code=502,
            detail=f"ITS API가 HTTP {exc.response.status_code} 오류를 반환했습니다.",
        ) from None
    except httpx.RequestError as exc:
        record_provider_status(
            EVENT_SERVICE_NAME, "error", last_error="ITS 연결 실패"
        )
        logger.error("ITS event request failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="ITS API에 연결하지 못했습니다."
        ) from None
    except ET.ParseError as exc:
        record_provider_status(
            EVENT_SERVICE_NAME,
            "invalid_response",
            last_error="ITS 응답 XML 파싱 실패",
            http_status=response.status_code,
            response_format="xml",
        )
        logger.error("ITS returned invalid XML (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="ITS API가 유효한 XML 응답을 반환하지 않았습니다."
        ) from None

    if root.tag != "response":
        record_provider_status(
            EVENT_SERVICE_NAME,
            "invalid_response",
            last_error="ITS 응답 구조 확인 필요",
            http_status=response.status_code,
            response_format="xml",
        )
        raise HTTPException(
            status_code=502,
            detail="ITS 돌발정보 응답에서 문서에 명시된 response 요소를 확인할 수 없습니다.",
        )

    header = root.find("./header")
    result_code = header.findtext("resultCode") if header is not None else None
    if result_code is None:
        record_provider_status(
            EVENT_SERVICE_NAME,
            "invalid_response",
            last_error="ITS 응답 필드 확인 필요",
            http_status=response.status_code,
            response_format="xml",
        )
        raise HTTPException(
            status_code=502,
            detail="ITS 돌발정보 응답에서 문서에 명시된 resultCode를 확인할 수 없습니다.",
        )
    if result_code != "0":
        message = header.findtext("resultMsg") if header is not None else None
        message = str(
            redact_secret(message or "ITS API 요청 실패", settings.traffic_api_key)
        )
        status = "auth_error" if result_code == "4005" else "error"
        record_provider_status(
            EVENT_SERVICE_NAME,
            status,
            last_error=message,
            http_status=response.status_code,
            api_result_code=result_code,
            response_format="xml",
        )
        raise HTTPException(status_code=502, detail=message)

    body = root.find("./body")
    items: list[dict[str, str | float | None]] = []
    if body is not None:
        for item in body.findall("./items/item"):
            normalized: dict[str, str | float | None] = {}
            for field in (
                "type",
                "eventType",
                "eventDetailType",
                "startDate",
                "linkId",
                "roadName",
                "roadNo",
                "roadDrcType",
                "lanesBlockType",
                "lanesBlocked",
                "message",
                "endDate",
            ):
                value = item.findtext(field)
                normalized[field] = value.strip() if value else None
            for field in ("coordX", "coordY"):
                value = item.findtext(field)
                try:
                    coordinate = float(value) if value else None
                except ValueError:
                    record_provider_status(
                        EVENT_SERVICE_NAME,
                        "invalid_response",
                        last_error=f"ITS {field} 좌표 형식 오류",
                        http_status=response.status_code,
                        api_result_code=result_code,
                        response_format="xml",
                    )
                    raise HTTPException(
                        status_code=502,
                        detail=f"ITS 응답의 {field} 좌표가 올바른 숫자가 아닙니다.",
                    ) from None
                maximum = 180 if field == "coordX" else 90
                if coordinate is not None and (
                    not math.isfinite(coordinate) or abs(coordinate) > maximum
                ):
                    record_provider_status(
                        EVENT_SERVICE_NAME,
                        "invalid_response",
                        last_error=f"ITS {field} 좌표 범위 오류",
                        http_status=response.status_code,
                        api_result_code=result_code,
                        response_format="xml",
                    )
                    raise HTTPException(
                        status_code=502,
                        detail=f"ITS 응답의 {field} 좌표가 유효 범위를 벗어났습니다.",
                    )
                normalized[field] = coordinate
            items.append(normalized)

    fetched_at = datetime.now(timezone.utc).isoformat()
    result = {
        "source": "국가교통정보센터 ITS",
        "resource": "traffic_incidents",
        "fetched_at": fetched_at,
        "cached": False,
        "data": {
            "resultCode": result_code,
            "resultMsg": header.findtext("resultMsg"),
            "totalCount": body.findtext("totalCount") if body is not None else None,
            "items": items,
        },
    }
    record_provider_status(
        EVENT_SERVICE_NAME,
        "no_data" if not items else "connected",
        fetched_at,
        http_status=response.status_code,
        api_result_code=result_code,
        response_format="xml",
        record_count=len(items),
    )
    try:
        await set_cached(cache_key, result)
    except Exception as exc:
        logger.error("ITS event cache write failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503, detail="돌발정보 캐시를 저장할 수 없습니다."
        ) from None
    return result
