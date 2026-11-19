from typing import Any

from fastapi import APIRouter, Query

from app.services.tago_service import fetch_tago, require_verified_operation

router = APIRouter(prefix="/api/subway", tags=["subway"])


@router.get("/stations")
async def get_stations(
    station_name: str = Query(..., min_length=1, description="지하철역 이름 키워드"),
    page_no: int = Query(1, ge=1),
    num_of_rows: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return await fetch_tago(
        "subway_stations",
        {
            "subwayStationName": station_name.strip(),
            "pageNo": page_no,
            "numOfRows": num_of_rows,
        },
    )


@router.get("/lines")
async def get_lines() -> None:
    require_verified_operation("TAGO 지하철 관련 정보 조회")


@router.get("/arrivals")
async def get_arrivals() -> None:
    require_verified_operation("실시간 지하철 도착정보")


@router.get("/timetable")
async def get_timetable(
    station_id: str = Query(..., min_length=1, description="역 검색 결과의 지하철역 ID"),
    daily_type_code: str = Query(..., min_length=1, description="요일 구분 코드"),
    up_down_type_code: str = Query(..., min_length=1, description="상하행 구분 코드"),
    page_no: int = Query(1, ge=1),
    num_of_rows: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    return await fetch_tago(
        "subway_timetable",
        {
            "subwayStationId": station_id.strip(),
            "dailyTypeCode": daily_type_code.strip(),
            "upDownTypeCode": up_down_type_code.strip(),
            "pageNo": page_no,
            "numOfRows": num_of_rows,
        },
    )
