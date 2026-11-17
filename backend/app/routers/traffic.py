from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.services.providers.its_provider import (
    fetch_traffic_incidents,
    fetch_traffic_speed,
)

router = APIRouter(prefix="/api/traffic", tags=["traffic"])


@router.get("/speed")
async def get_traffic_speed(
    road_type: Literal["all", "ex", "its"] = Query(default="all", alias="type"),
    route_no: str | None = Query(default=None, alias="routeNo", min_length=1),
    direction: Literal["all", "up", "down", "start", "end"] = Query(
        default="all", alias="drcType"
    ),
    min_x: float | None = Query(default=None, alias="minX"),
    max_x: float | None = Query(default=None, alias="maxX"),
    min_y: float | None = Query(default=None, alias="minY"),
    max_y: float | None = Query(default=None, alias="maxY"),
) -> dict[str, object]:
    if road_type != "all" and not route_no:
        raise HTTPException(
            status_code=422,
            detail="도로 유형이 ex 또는 its이면 노선 번호 routeNo가 필요합니다.",
        )

    bounds = (min_x, max_x, min_y, max_y)
    if any(value is not None for value in bounds) and road_type != "all" and direction != "all":
        raise HTTPException(
            status_code=422,
            detail="위치 범위는 type=all 또는 drcType=all인 요청에서만 사용할 수 있습니다.",
        )

    query: dict[str, str | float] = {
        "type": road_type,
        "drcType": direction,
        "getType": "json",
    }
    if route_no:
        query["routeNo"] = route_no
    for key, value in zip(("minX", "maxX", "minY", "maxY"), bounds):
        if value is not None:
            query[key] = value
    return await fetch_traffic_speed(query)


@router.get("/congestion")
async def get_traffic_congestion() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "ITS 교통소통 API는 도로 속도를 제공합니다. "
            "공식 혼잡 등급 또는 등급 기준이 확인되지 않아 혼잡도 분류는 제공하지 않습니다."
        ),
    )


@router.get("/incidents")
async def get_traffic_incidents(
    road_type: Literal["all", "ex", "its", "loc", "sgg", "etc"] = Query(
        default="all", alias="type"
    ),
    event_type: Literal["all", "cor", "acc", "wea", "ete", "dis", "etc"] = Query(
        default="all", alias="eventType"
    ),
    min_x: float | None = Query(default=None, alias="minX"),
    max_x: float | None = Query(default=None, alias="maxX"),
    min_y: float | None = Query(default=None, alias="minY"),
    max_y: float | None = Query(default=None, alias="maxY"),
) -> dict[str, object]:
    bounds = (min_x, max_x, min_y, max_y)
    if any(value is not None for value in bounds) and not all(
        value is not None for value in bounds
    ):
        raise HTTPException(
            status_code=422,
            detail="위치 범위를 지정하려면 minX, maxX, minY, maxY를 모두 입력해야 합니다.",
        )
    if any(value is not None for value in bounds) and (
        road_type != "all" and event_type != "all"
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "위치 범위는 type=all 또는 eventType=all인 요청에서만 "
                "사용할 수 있습니다."
            ),
        )

    query: dict[str, str | float] = {
        "type": road_type,
        "eventType": event_type,
        "getType": "xml",
    }
    for key, value in zip(("minX", "maxX", "minY", "maxY"), bounds):
        if value is not None:
            query[key] = value
    return await fetch_traffic_incidents(query)
