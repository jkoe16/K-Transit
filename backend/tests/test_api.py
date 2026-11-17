from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_unconfigured_providers_without_secrets(monkeypatch):
    from app.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "stcis_api_key", "")
    monkeypatch.setattr(settings, "tago_api_key", "")
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["services"]["subway"]["status"] == "endpoint_unknown"
    assert body["services"]["bus_arrivals"]["status"] == "key_required"
    assert "api_key" not in str(body).lower()


def test_github_pages_origin_is_allowed_for_get_preflight():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://jkoe16.github.io",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://jkoe16.github.io"


def test_health_does_not_call_configured_services_connected_before_a_success(
    monkeypatch,
):
    from app.config import get_settings
    from app.services import provider_status

    settings = get_settings()
    monkeypatch.setattr(settings, "stcis_api_key", "test-stcis-key")
    monkeypatch.setattr(settings, "tago_api_key", "test-tago-key")
    monkeypatch.setattr(provider_status, "_statuses", {})

    response = client.get("/api/health")

    assert response.status_code == 200
    services = response.json()["services"]
    assert services["stcis_regions"] == {
        "status": "waiting",
        "last_success_at": None,
        "last_error": None,
        "http_status": None,
        "api_result_code": None,
        "response_format": None,
        "record_count": None,
    }
    assert services["bus_arrivals"]["status"] == "waiting"


def test_health_includes_safe_provider_response_diagnostics(monkeypatch):
    from app.config import get_settings
    from app.services import provider_status

    monkeypatch.setattr(get_settings(), "stcis_api_key", "test-key")
    monkeypatch.setattr(provider_status, "_statuses", {})
    provider_status.record_provider_status(
        "stcis_regions",
        "no_data",
        http_status=200,
        api_result_code="0",
        response_format="json",
        record_count=0,
    )

    status = client.get("/api/health").json()["services"]["stcis_regions"]

    assert status["status"] == "no_data"
    assert status["last_success_at"]
    assert status["http_status"] == 200
    assert status["api_result_code"] == "0"
    assert status["response_format"] == "json"
    assert status["record_count"] == 0


def test_stcis_endpoint_reports_missing_key(monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "stcis_api_key", "")
    response = client.get("/api/regions")

    assert response.status_code == 503
    assert "STCIS_API_KEY" in response.json()["detail"]


def test_missing_provider_keys_skip_external_requests(monkeypatch):
    import httpx

    from app.config import get_settings
    from app.services import provider_status

    settings = get_settings()
    monkeypatch.setattr(settings, "stcis_api_key", "")
    monkeypatch.setattr(settings, "tago_api_key", "")
    monkeypatch.setattr(settings, "traffic_api_key", "")
    monkeypatch.setattr(provider_status, "_statuses", {})

    def forbidden_request(*_args, **_kwargs):
        raise AssertionError("external request must not run without an API key")

    monkeypatch.setattr(httpx, "AsyncClient", forbidden_request)

    responses = [
        client.get("/api/regions"),
        client.get("/api/bus/arrivals?city_code=25&node_id=DJB8001793"),
        client.get("/api/traffic/incidents"),
    ]

    assert [response.status_code for response in responses] == [503, 503, 503]
    assert "STCIS_API_KEY" in responses[0].json()["detail"]
    assert "TAGO_API_KEY" in responses[1].json()["detail"]
    assert "TRAFFIC_API_KEY" in responses[2].json()["detail"]


def test_unintegrated_routes_do_not_return_placeholder_data():
    response = client.get("/api/subway/stations")

    assert response.status_code == 501
    assert "연동되지 않았습니다" in response.json()["detail"]


def test_bus_stop_search_requires_a_search_condition():
    response = client.get("/api/bus/stops")

    assert response.status_code == 422
