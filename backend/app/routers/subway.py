from fastapi import APIRouter

from app.services.tago_service import require_verified_operation

router = APIRouter(prefix="/api/subway", tags=["subway"])


@router.get("/stations")
async def get_stations() -> None:
    require_verified_operation("TAGO 지하철역 조회")


@router.get("/lines")
async def get_lines() -> None:
    require_verified_operation("TAGO 지하철 관련 정보 조회")


@router.get("/arrivals")
async def get_arrivals() -> None:
    require_verified_operation("실시간 지하철 도착정보")


@router.get("/timetable")
async def get_timetable() -> None:
    require_verified_operation("TAGO 지하철 시간표")
