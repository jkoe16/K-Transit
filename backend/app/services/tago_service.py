from fastapi import HTTPException


def require_verified_operation(feature: str = "TAGO 지하철정보") -> None:
    raise HTTPException(
        status_code=501,
        detail=f"{feature} API 명세는 확인되었으며, 현재 애플리케이션에는 아직 연동되지 않았습니다.",
    )
