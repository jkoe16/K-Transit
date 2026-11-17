import httpx
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services import provider_status, tago_service

client = TestClient(app)
TEST_API_KEY = "test-tago-key-not-a-real-credential"


def install_tago_mock(monkeypatch, payload):
    monkeypatch.setattr(provider_status, "_statuses", {})
    settings = get_settings()
    monkeypatch.setattr(settings, "tago_api_key", TEST_API_KEY)
    monkeypatch.setattr(settings, "redis_url", "")
    requests = []

    async def cache_miss(_key):
        return None

    async def skip_cache(_key, _value):
        return None

    monkeypatch.setattr(tago_service, "get_cached", cache_miss)
    monkeypatch.setattr(tago_service, "set_cached", skip_cache)

    def handler(request):
        requests.append(request)
        return httpx.Response(200, json=payload)

    real_async_client = httpx.AsyncClient

    def make_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(tago_service.httpx, "AsyncClient", make_client)
    return requests


def test_tago_arrivals_forward_official_parameters_and_raw_response(monkeypatch):
    payload = {
        "response": {
            "header": {"resultCode": "00", "resultMsg": "OK"},
            "body": {"items": {"item": [{"routeno": "5", "arrtime": 816}]}},
        }
    }
    requests = install_tago_mock(monkeypatch, payload)

    response = client.get(
        "/api/bus/arrivals?city_code=25&node_id=DJB8001793"
    )

    assert response.status_code == 200
    assert len(requests) == 1
    assert requests[0].url.path.endswith(
        "/getSttnAcctoArvlPrearngeInfoList"
    )
    assert dict(requests[0].url.params) == {
        "cityCode": "25",
        "nodeId": "DJB8001793",
        "pageNo": "1",
        "numOfRows": "10",
        "serviceKey": TEST_API_KEY,
        "_type": "json",
    }
    assert response.json()["data"] == payload
    status = client.get("/api/health").json()["services"]["bus_arrivals"]
    assert status["status"] == "connected"
    assert status["last_success_at"]
    assert status["http_status"] == 200
    assert status["api_result_code"] == "00"
    assert status["response_format"] == "json"
    assert status["record_count"] == 1


def test_tago_city_code_list_uses_documented_operation(monkeypatch):
    requests = install_tago_mock(
        monkeypatch,
        {"response": {"header": {"resultCode": "00", "resultMsg": "OK"}}},
    )

    response = client.get("/api/bus/arrival-cities")

    assert response.status_code == 200
    assert requests[0].url.path.endswith("/getCtyCodeList")
    assert dict(requests[0].url.params) == {
        "serviceKey": TEST_API_KEY,
        "_type": "json",
    }
    services = client.get("/api/health").json()["services"]
    assert services["bus_arrival_cities"]["status"] == "connected"
    assert services["bus_arrivals"]["status"] == "waiting"


def test_tago_provider_error_is_not_reported_as_success(monkeypatch):
    install_tago_mock(
        monkeypatch,
        {
            "response": {
                "header": {"resultCode": "03", "resultMsg": "NO_DATA"},
                "body": {},
            }
        },
    )

    response = client.get(
        "/api/bus/arrivals?city_code=25&node_id=DJB8001793"
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "NO_DATA"
    status = client.get("/api/health").json()["services"]["bus_arrivals"]
    assert status["status"] == "error"
    assert status["api_result_code"] == "03"


def test_tago_no_data_response_is_recorded_separately(monkeypatch):
    install_tago_mock(
        monkeypatch,
        {
            "response": {
                "header": {"resultCode": "00", "resultMsg": "OK"},
                "body": {"totalCount": 0, "items": {"item": None}},
            }
        },
    )

    response = client.get("/api/bus/arrivals?city_code=25&node_id=DJB8001793")

    assert response.status_code == 200
    status = client.get("/api/health").json()["services"]["bus_arrivals"]
    assert status["status"] == "no_data"
    assert status["record_count"] == 0


def test_tago_response_without_documented_header_is_invalid(monkeypatch):
    install_tago_mock(monkeypatch, {"unexpected": True})

    response = client.get("/api/bus/arrivals?city_code=25&node_id=DJB8001793")

    assert response.status_code == 502
    assert "resultCode" in response.json()["detail"]
    assert client.get("/api/health").json()["services"]["bus_arrivals"][
        "status"
    ] == "invalid_response"


def test_tago_api_key_is_redacted_from_success_response(monkeypatch):
    install_tago_mock(
        monkeypatch,
        {"response": {"header": {"resultCode": "00"}, "echo": TEST_API_KEY}},
    )

    response = client.get(
        "/api/bus/arrivals?city_code=25&node_id=DJB8001793"
    )

    assert response.status_code == 200
    assert response.json()["data"]["response"]["echo"] == "[redacted]"
    assert TEST_API_KEY not in response.text
