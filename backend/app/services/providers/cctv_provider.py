from fastapi import HTTPException


def require_verified_location_operation() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "국토교통부 교통CCTV 데이터 페이지에서 위치 데이터의 설명은 확인했지만 "
            "실제 호출 URL과 요청변수가 확인되지 않아 연동하지 않았습니다."
        ),
    )


def require_verified_video_operation() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "CCTV 화상자료의 영상 상세 호출 URL, 응답 필드 및 이용 조건이 확인되지 않아 "
            "영상 조회를 제공하지 않습니다."
        ),
    )
