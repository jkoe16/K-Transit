from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services.stcis_service import fetch_stcis
from app.services.tago_service import fetch_tago

router = APIRouter(prefix="/api/bus", tags=["bus"])


@router.get("/stops")
async def search_stops(
    sd_cd: str | None = None,
    sgg_cd: str | None = None,
    emd_cd: str | None = None,
    sttn_arsno: str | None = None,
) -> dict[str, Any]:
    if not any((sd_cd, sgg_cd, emd_cd, sttn_arsno)):
        raise HTTPException(
            status_code=422,
            detail="STCIS 지역 코드 또는 정류장 ARS 번호를 하나 이상 입력하세요.",
        )
    return await fetch_stcis(
        "bus_stops",
        {
            "sdCd": sd_cd,
            "sggCd": sgg_cd,
            "emdCd": emd_cd,
            "sttnArsno": sttn_arsno,
        },
    )


@router.get("/stops/{stop_id}")
async def get_stop(
    stop_id: str,
    sd_cd: str = Query(..., description="STCIS 시도 코드"),
    sgg_cd: str | None = None,
    emd_cd: str | None = None,
) -> dict[str, Any]:
    return await fetch_stcis(
        "bus_stops",
        {
            "sdCd": sd_cd,
            "sggCd": sgg_cd,
            "emdCd": emd_cd,
            "sttnArsno": stop_id,
        },
    )


@router.get("/routes/{route_id}/stops")
async def get_route_stops(route_id: str) -> dict[str, Any]:
    return await fetch_stcis("route_stops", {"routeNm": route_id})


@router.get("/routes")
async def search_routes(route_nm: str = Query(..., min_length=1)) -> dict[str, Any]:
    return await fetch_stcis("route_stops", {"routeNm": route_nm})


@router.get("/positions")
async def get_bus_positions() -> None:
    from app.services.klid_service import require_verified_operation

    require_verified_operation()


@router.get("/arrivals")
async def get_bus_arrivals(
    city_code: str = Query(..., min_length=1, alias="city_code"),
    node_id: str = Query(..., min_length=1, alias="node_id"),
    page_no: int = Query(default=1, ge=1),
    num_of_rows: int = Query(default=10, ge=1, le=100),
) -> dict[str, Any]:
    return await fetch_tago(
        "bus_arrivals",
        {
            "cityCode": city_code,
            "nodeId": node_id,
            "pageNo": page_no,
            "numOfRows": num_of_rows,
        },
    )


@router.get("/arrival-cities")
async def get_arrival_cities() -> dict[str, Any]:
    return await fetch_tago("arrival_cities", {})
