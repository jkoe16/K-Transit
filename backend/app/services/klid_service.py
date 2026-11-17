from fastapi import HTTPException


def require_verified_operation() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "한국지역정보개발원 초정밀버스 위치 API의 상세기능 URL, "
            "요청변수, 응답 필드 및 좌표계가 확인되지 않아 연동되지 않았습니다."
        ),
    )
