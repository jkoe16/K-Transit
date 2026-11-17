import logging

import httpx
import pytest

from app.config import get_settings
from app.main import app
from app.services import provider_status, stcis_service
from fastapi.testclient import TestClient

client = TestClient(app)
TEST_API_KEY = "test-key-not-a-real-credential"


def install_stcis_mock(monkeypatch, payload):
    monkeypatch.setattr(provider_status, "_statuses", {})
    settings = get_settings()
    monkeypatch.setattr(settings, "stcis_api_key", TEST_API_KEY)
    monkeypatch.setattr(settings, "redis_url", "")
    requests = []

    async def cache_miss(_key):
        return None

    async def skip_cache(_key, _value):
        return None

    monkeypatch.setattr(stcis_service, "get_cached", cache_miss)
    monkeypatch.setattr(stcis_service, "set_cached", skip_cache)

    def handler(request):
        requests.append(request)
        return httpx.Response(200, json=payload)

    real_async_client = httpx.AsyncClient

    def make_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(stcis_service.httpx, "AsyncClient", make_client)
    return requests


@pytest.mark.parametrize(
    ("request_url", "expected_path", "expected_params"),
    [
        (
            "/api/regions?sd_cd=11&sgg_cd=110",
            "/openapi/areacode.json",
            {"sdCd": "11", "sggCd": "110"},
        ),
        (
            "/api/bus/stops?sd_cd=11&sgg_cd=110&emd_cd=11010&sttn_arsno=1234",
            "/openapi/bussttn.json",
            {"sdCd": "11", "sggCd": "110", "emdCd": "11010", "sttnArsno": "1234"},
        ),
        (
            "/api/bus/routes?route_nm=300",
            "/openapi/rlrdroutesttn.json",
            {"routeNm": "300"},
        ),
        (
            "/api/bus/routes/300/stops",
            "/openapi/rlrdroutesttn.json",
            {"routeNm": "300"},
        ),
        (
            "/api/statistics/quarter-od?oprat_date=20261117&stg_emd_cd=11010&arr_emd_cd=11020",
            "/openapi/quarterod.json",
            {
                "opratDate": "20261117",
                "stgEmdCd": "11010",
                "arrEmdCd": "11020",
            },
        ),
    ],
)
def test_stcis_proxies_forward_documented_parameters(
    monkeypatch, request_url, expected_path, expected_params
):
    payload = {"provider_fixture": [{"test": "response"}]}
    requests = install_stcis_mock(monkeypatch, payload)

    response = client.get(request_url)

    assert response.status_code == 200
    assert len(requests) == 1
    request = requests[0]
    assert request.url.path == expected_path
    assert dict(request.url.params) == {**expected_params, "apikey": TEST_API_KEY}
    body = response.json()
    assert body["data"] == payload
    assert body["source"] == "STCIS"
    assert body["fetched_at"]
    status_key = {
        "/openapi/areacode.json": "stcis_regions",
        "/openapi/bussttn.json": "stcis_bus_stops",
        "/openapi/rlrdroutesttn.json": "stcis_bus_routes",
        "/openapi/quarterod.json": "stcis_statistics",
    }[expected_path]
    service_status = client.get("/api/health").json()["services"][status_key]
    assert service_status["status"] == "connected"
    assert service_status["last_success_at"] == body["fetched_at"]


def test_stcis_api_key_is_redacted_from_response_and_logs(monkeypatch, caplog):
    payload = {
        "status": "ERROR",
        "error": {"code": "TEST", "text": f"Rejected {TEST_API_KEY}"},
    }
    install_stcis_mock(monkeypatch, payload)
    caplog.set_level(logging.INFO)

    response = client.get("/api/regions")

    assert response.status_code == 502
    assert TEST_API_KEY not in response.text
    assert TEST_API_KEY not in caplog.text
    assert "[redacted]" in response.json()["detail"]


def test_success_payload_is_redacted_if_provider_echoes_api_key(monkeypatch):
    install_stcis_mock(monkeypatch, {"echo": TEST_API_KEY})

    response = client.get("/api/regions")

    assert response.status_code == 200
    assert response.json()["data"] == {"echo": "[redacted]"}
    assert TEST_API_KEY not in response.text
