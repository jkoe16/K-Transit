import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services import tago_service

client = TestClient(app)


def test_health_reports_unconfigured_providers_without_secrets(monkeypatch):
    monkeypatch.setattr(get_settings(), "tago_api_key", "")
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["services"]["tago"] == "not_configured"
    assert body["services"]["route_search"] == "not_integrated"
    assert "api_key" not in str(body).lower()


def test_health_reports_tago_configured_without_leaking_key(monkeypatch):
    monkeypatch.setattr(get_settings(), "tago_api_key", "secret-tago-key")
    response = client.get("/health")

    assert response.json()["services"]["tago"] == "configured"
    assert "secret-tago-key" not in response.text


def test_stcis_endpoint_reports_missing_key(monkeypatch):
    monkeypatch.setattr(get_settings(), "stcis_api_key", "")
    response = client.get("/api/regions")

    assert response.status_code == 503
    assert "STCIS_API_KEY" in response.json()["detail"]


def test_unintegrated_routes_do_not_return_placeholder_data():
    response = client.get("/api/subway/lines")

    assert response.status_code == 501
    assert "연동되지 않았습니다" in response.json()["detail"]


def test_bus_stop_search_requires_a_search_condition():
    response = client.get("/api/bus/stops")

    assert response.status_code == 422


# --- TAGO 프록시 ---------------------------------------------------------


class FakeResponse:
    def __init__(self, payload=None, status_code=200, invalid_json=False):
        self._payload = payload
        self.status_code = status_code
        self._invalid_json = invalid_json

    def json(self):
        if self._invalid_json:
            raise ValueError("not json")
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            request = httpx.Request("GET", "https://example.invalid")
            raise httpx.HTTPStatusError(
                "error", request=request, response=httpx.Response(self.status_code, request=request)
            )


@pytest.fixture
def fake_tago(monkeypatch):
    """httpx 호출을 가로채 요청 내용을 기록한다."""
    calls: list[dict] = []
    state = {"response": FakeResponse({"response": {"header": {"resultCode": "00"}, "body": {}}})}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, url, params=None):
            calls.append({"url": url, "params": dict(params or {})})
            return state["response"]

    monkeypatch.setattr(tago_service.httpx, "AsyncClient", FakeClient)
    monkeypatch.setattr(get_settings(), "api_cache_ttl_seconds", 0)
    monkeypatch.setattr(get_settings(), "tago_api_key", "key%2Bvalue")
    return calls, state


def test_tago_endpoint_reports_missing_key(monkeypatch):
    monkeypatch.setattr(get_settings(), "tago_api_key", "")
    response = client.get("/api/subway/stations", params={"station_name": "서울"})

    assert response.status_code == 503
    assert "TAGO_API_KEY" in response.json()["detail"]


def test_subway_station_search_requires_name():
    assert client.get("/api/subway/stations").status_code == 422


def test_subway_timetable_requires_all_conditions():
    response = client.get("/api/subway/timetable", params={"station_id": "ST1"})

    assert response.status_code == 422


def test_bus_arrivals_require_city_and_node():
    assert client.get("/api/bus/arrivals", params={"city_code": "25"}).status_code == 422
    assert client.get("/api/bus/arrivals", params={"node_id": "DJB1"}).status_code == 422


def test_subway_station_search_proxies_raw_json(fake_tago):
    calls, state = fake_tago
    payload = {"response": {"header": {"resultCode": "00"}, "body": {"items": {"item": []}}}}
    state["response"] = FakeResponse(payload)

    response = client.get("/api/subway/stations", params={"station_name": "서울"})

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "TAGO"
    assert body["resource"] == "subway_stations"
    assert body["data"] == payload
    assert "key" not in str(body["data"]).lower()
    call = calls[0]
    assert call["url"].endswith("/SubwayInfo/getKwrdFndSubwaySttnList")
    assert call["params"]["subwayStationName"] == "서울"
    assert call["params"]["_type"] == "json"
    # 인코딩 키는 한 번 디코딩해서 전달한다.
    assert call["params"]["serviceKey"] == "key+value"


def test_subway_timetable_passes_conditions(fake_tago):
    calls, _ = fake_tago

    response = client.get(
        "/api/subway/timetable",
        params={"station_id": "ST1", "daily_type_code": "01", "up_down_type_code": "U"},
    )

    assert response.status_code == 200
    call = calls[0]
    assert call["url"].endswith("/SubwayInfo/getSubwaySttnAcctoSchdulList")
    assert call["params"]["subwayStationId"] == "ST1"
    assert call["params"]["dailyTypeCode"] == "01"
    assert call["params"]["upDownTypeCode"] == "U"


def test_bus_arrivals_call_official_service_path(fake_tago):
    calls, _ = fake_tago

    response = client.get("/api/bus/arrivals", params={"city_code": "25", "node_id": "DJB8001793"})

    assert response.status_code == 200
    call = calls[0]
    assert "/ArvlInfoInqireService/" in call["url"]
    assert not call["url"].endswith("ArvlInfoInqireServiced")
    assert call["params"]["cityCode"] == "25"
    assert call["params"]["nodeId"] == "DJB8001793"


def test_tago_error_code_returns_502_and_hides_key(fake_tago):
    _, state = fake_tago
    state["response"] = FakeResponse(
        {"response": {"header": {"resultCode": "30", "resultMsg": "bad key+value given"}}}
    )

    response = client.get("/api/subway/stations", params={"station_name": "서울"})

    assert response.status_code == 502
    assert "30" in response.json()["detail"]
    assert "key+value" not in response.text


def test_tago_non_json_response_returns_502(fake_tago):
    _, state = fake_tago
    state["response"] = FakeResponse(invalid_json=True)

    response = client.get("/api/subway/stations", params={"station_name": "서울"})

    assert response.status_code == 502


def test_tago_http_error_returns_502(fake_tago):
    _, state = fake_tago
    state["response"] = FakeResponse(status_code=500)

    response = client.get("/api/subway/stations", params={"station_name": "서울"})

    assert response.status_code == 502
    assert "500" in response.json()["detail"]
