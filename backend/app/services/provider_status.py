from datetime import datetime, timezone

ProviderStatus = dict[str, str | int | None]

_statuses: dict[str, ProviderStatus] = {}


def record_provider_status(
    service: str,
    status: str,
    last_success_at: str | None = None,
    last_error: str | None = None,
    *,
    http_status: int | None = None,
    api_result_code: str | None = None,
    response_format: str | None = None,
    record_count: int | None = None,
) -> None:
    current = _statuses.get(
        service,
        {
            "status": "waiting",
            "last_success_at": None,
            "last_error": None,
            "http_status": None,
            "api_result_code": None,
            "response_format": None,
            "record_count": None,
        },
    )
    succeeded = status in {"connected", "no_data"}
    current = {
        **current,
        "status": status,
        "last_success_at": (
            last_success_at or datetime.now(timezone.utc).isoformat()
            if succeeded
            else current.get("last_success_at")
        ),
        "last_error": None if succeeded else last_error or current.get("last_error"),
        "http_status": http_status,
        "api_result_code": api_result_code,
        "response_format": response_format,
        "record_count": record_count,
    }
    _statuses[service] = current


def get_provider_status(
    service: str,
    *,
    configured: bool,
    integrated: bool = True,
    unintegrated_status: str = "waiting",
) -> ProviderStatus:
    current = _statuses.get(
        service,
        {
            "status": "waiting",
            "last_success_at": None,
            "last_error": None,
            "http_status": None,
            "api_result_code": None,
            "response_format": None,
            "record_count": None,
        },
    )
    if not integrated:
        status = unintegrated_status
    elif not configured:
        status = "key_required"
    else:
        status = (
            "waiting"
            if current["status"] == "key_required"
            else current["status"] or "waiting"
        )
    return {
        "status": status,
        "last_success_at": current["last_success_at"],
        "last_error": current["last_error"],
        "http_status": current["http_status"],
        "api_result_code": current["api_result_code"],
        "response_format": current["response_format"],
        "record_count": current["record_count"],
    }
