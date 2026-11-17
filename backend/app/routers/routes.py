from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/routes", tags=["routes"])


@router.get("/search")
async def search_routes() -> None:
    raise HTTPException(
        status_code=501,
        detail="출발·도착지 대중교통 경로 검색 API가 확인되지 않아 연동되지 않았습니다.",
    )
