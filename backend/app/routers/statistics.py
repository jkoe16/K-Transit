from typing import Any

from fastapi import APIRouter, Query

from app.services.stcis_service import fetch_stcis

router = APIRouter(prefix="/api/statistics", tags=["statistics"])


@router.get("/quarter-od")
async def get_quarter_od(
    oprat_date: str = Query(..., description="STCIS 운행일자"),
    stg_emd_cd: str = Query(..., description="출발 읍면동 코드"),
    arr_emd_cd: str = Query(..., description="도착 읍면동 코드"),
) -> dict[str, Any]:
    return await fetch_stcis(
        "quarter_od",
        {
            "opratDate": oprat_date,
            "stgEmdCd": stg_emd_cd,
            "arrEmdCd": arr_emd_cd,
        },
    )
