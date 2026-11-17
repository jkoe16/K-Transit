from fastapi import APIRouter

from app.services.providers.cctv_provider import (
    require_verified_location_operation,
    require_verified_video_operation,
)

router = APIRouter(prefix="/api/cctv", tags=["cctv"])


@router.get("")
async def get_cctv_locations() -> None:
    require_verified_location_operation()


@router.get("/video")
async def get_cctv_video() -> None:
    require_verified_video_operation()
