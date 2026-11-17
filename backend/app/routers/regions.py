from typing import Any

from fastapi import APIRouter, Query

from app.services.stcis_service import fetch_stcis

router = APIRouter(prefix="/api/regions", tags=["regions"])


@router.get("")
async def get_regions(
    sd_cd: str | None = Query(default=None, alias="sd_cd"),
    sgg_cd: str | None = Query(default=None, alias="sgg_cd"),
) -> dict[str, Any]:
    return await fetch_stcis("regions", {"sdCd": sd_cd, "sggCd": sgg_cd})


@router.get("/districts")
async def get_districts(
    sd_cd: str | None = Query(default=None, alias="sd_cd"),
    sgg_cd: str | None = Query(default=None, alias="sgg_cd"),
) -> dict[str, Any]:
    return await fetch_stcis("regions", {"sdCd": sd_cd, "sggCd": sgg_cd})
