import httpx
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.services import provider_status
from app.services.providers import its_provider

client = TestClient(app)
TEST_API_KEY = "test-its-key-not-a-real-credential"


def install_its_mock(monkeypatch, payload):
    monkeypatch.setattr(provider_status, "_statuses", {})
    settings = get_settings()
    monkeypatch.setattr(settings, "traffic_api_key", TEST_API_KEY)
    monkeypatch.setattr(settings, "redis_url", "")
    requests = []

    async def cache_miss(_key):
        return None

    async def skip_cache(_key, _value):
        return None

    monkeypatch.setattr(its_provider, "get_cached", cache_miss)
    monkeypatch.setattr(its_provider, "set_cached", skip_cache)

    def handler(request):
        requests.append(request)
        return httpx.Response(200, json=payload)

    real_async_client = httpx.AsyncClient

    def make_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(its_provider.httpx, "AsyncClient", make_client)
    return requests


def install_its_xml_mock(monkeypatch, payload):
    monkeypatch.setattr(provider_status, "_statuses", {})
    settings = get_settings()
    monkeypatch.setattr(settings, "traffic_api_key", TEST_API_KEY)
    monkeypatch.setattr(settings, "redis_url", "")
    requests = []

    async def cache_miss(_key):
        return None

    async def skip_cache(_key, _value):
        return None

    monkeypatch.setattr(its_provider, "get_cached", cache_miss)
    monkeypatch.setattr(its_provider, "set_cached", skip_cache)

    def handler(request):
        requests.append(request)
        return httpx.Response(
            200,
            content=payload,
            headers={"Content-Type": "application/xml"},
        )

    real_async_client = httpx.AsyncClient

    def make_client(*args, **kwargs):
        kwargs["transport"] = httpx.MockTransport(handler)
        return real_async_client(*args, **kwargs)

    monkeypatch.setattr(its_provider.httpx, "AsyncClient", make_client)
    return requests


def test_traffic_speed_forwards_documented_its_parameters(monkeypatch):
    payload = {
        "resultCode": "0",
        "resultMsg": "SUCCESS",
        "totalCount": "1",
        "roadName": "테스트 도로",
        "speed": "60",
        "linkId": "1234567890",
    }
    requests = install_its_mock(monkeypatch, payload)

    response = client.get(
        "/api/traffic/speed?type=all&drcType=all&minX=126.8&maxX=127.2&minY=37.4&maxY=37.7"
    )

    assert response.status_code == 200
    assert len(requests) == 1
    request = requests[0]
    assert str(request.url).startswith("https://openapi.its.go.kr:9443/trafficInfo?")
    assert dict(request.url.params) == {
        "type": "all",
        "drcType": "all",
        "getType": "json",
        "minX": "126.8",
        "maxX": "127.2",
        "minY": "37.4",
        "maxY": "37.7",
        "apiKey": TEST_API_KEY,
    }
    assert response.json()["data"] == payload
    assert client.get("/api/health").json()["services"]["its_traffic_speed"][
        "status"
    ] == "connected"
    status = client.get("/api/health").json()["services"]["its_traffic_speed"]
    assert status["http_status"] == 200
    assert status["api_result_code"] == "0"
    assert status["response_format"] == "json"
    assert status["record_count"] == 1


def test_traffic_incidents_forwards_official_parameters_and_normalizes_xml(monkeypatch):
    payload = """<?xml version="1.0" encoding="UTF-8"?>
    <response>
      <header><resultCode>0</resultCode><resultMsg>SUCCESS</resultMsg></header>
      <body><totalCount>1</totalCount><items><item>
        <type>고속도로</type><eventType>교통사고</eventType>
        <eventDetailType>추돌</eventDetailType><startDate>20261117090000</startDate>
        <coordX>127.5166</coordX><coordY>34.9011</coordY><linkId>2884061000</linkId>
        <roadName>남해선</roadName><roadNo>101</roadNo>
        <roadDrcType>하행</roadDrcType><message>사고 발생</message>
        <endDate></endDate>
      </item></items></body>
    </response>""".encode("utf-8")
    requests = install_its_xml_mock(monkeypatch, payload)

    response = client.get(
        "/api/traffic/incidents?type=all&eventType=all&minX=126.8&maxX=127.2&minY=34.9&maxY=35.1"
    )

    assert response.status_code == 200
    request = requests[0]
    assert str(request.url).startswith("https://openapi.its.go.kr:9443/eventInfo?")
    assert dict(request.url.params) == {
        "type": "all",
        "eventType": "all",
        "getType": "xml",
        "minX": "126.8",
        "maxX": "127.2",
        "minY": "34.9",
        "maxY": "35.1",
        "apiKey": TEST_API_KEY,
    }
    data = response.json()["data"]
    assert data["resultCode"] == "0"
    assert data["items"][0]["coordX"] == 127.5166
    assert data["items"][0]["coordY"] == 34.9011
    assert client.get("/api/health").json()["services"]["its_traffic_events"][
        "status"
    ] == "connected"
    status = client.get("/api/health").json()["services"]["its_traffic_events"]
    assert status["http_status"] == 200
    assert status["api_result_code"] == "0"
    assert status["response_format"] == "xml"
    assert status["record_count"] == 1


def test_traffic_speed_requires_route_for_specific_road_type():
    response = client.get("/api/traffic/speed?type=ex&drcType=up")

    assert response.status_code == 422


def test_traffic_incidents_requires_complete_bounds_and_supported_filters():
    incomplete_bounds = client.get(
        "/api/traffic/incidents?minX=126.8&maxX=127.2"
    )
    unsupported_bounds = client.get(
        "/api/traffic/incidents?type=ex&eventType=acc&minX=126.8&maxX=127.2&minY=34.9&maxY=35.1"
    )

    assert incomplete_bounds.status_code == 422
    assert unsupported_bounds.status_code == 422


def test_traffic_incidents_provider_error_is_not_success(monkeypatch):
    install_its_xml_mock(
        monkeypatch,
        b"""<?xml version="1.0" encoding="UTF-8"?>
        <response>
          <header><resultCode>4005</resultCode><resultMsg>AUTH_ERROR</resultMsg></header>
          <body><totalCount>0</totalCount></body>
        </response>""",
    )

    response = client.get("/api/traffic/incidents")

    assert response.status_code == 502
    assert response.json()["detail"] == "AUTH_ERROR"
    assert client.get("/api/health").json()["services"]["its_traffic_events"][
        "status"
    ] == "auth_error"
    assert client.get("/api/health").json()["services"]["its_traffic_events"][
        "api_result_code"
    ] == "4005"


def test_traffic_speed_does_not_report_provider_errors_as_success(monkeypatch):
    install_its_mock(
        monkeypatch,
        {"resultCode": "1", "resultMsg": "AUTH_ERROR"},
    )

    response = client.get("/api/traffic/speed")

    assert response.status_code == 502
    assert response.json()["detail"] == "AUTH_ERROR"
    assert client.get("/api/health").json()["services"]["its_traffic_speed"][
        "status"
    ] == "error"


def test_traffic_incidents_with_zero_items_are_reported_as_no_data(monkeypatch):
    install_its_xml_mock(
        monkeypatch,
        b"""<?xml version="1.0" encoding="UTF-8"?>
        <response>
          <header><resultCode>0</resultCode><resultMsg>SUCCESS</resultMsg></header>
          <body><totalCount>0</totalCount></body>
        </response>""",
    )

    response = client.get("/api/traffic/incidents")

    assert response.status_code == 200
    status = client.get("/api/health").json()["services"]["its_traffic_events"]
    assert status["status"] == "no_data"
    assert status["record_count"] == 0


def test_provider_catalog_contains_no_api_key_values():
    response = client.get("/api/providers")

    assert response.status_code == 200
    providers = response.json()["providers"]
    traffic = next(item for item in providers if item["id"] == "its_traffic_speed")
    assert traffic["endpoint"] == "https://openapi.its.go.kr:9443/trafficInfo"
    assert traffic["key_env"] == "TRAFFIC_API_KEY"
    incidents = next(
        item for item in providers if item["id"] == "its_traffic_incidents"
    )
    assert incidents["endpoint"] == "https://openapi.its.go.kr:9443/eventInfo"
    assert "api_key" not in traffic
    assert "apiKey" not in traffic


def test_cctv_and_unclassified_congestion_are_not_faked():
    assert client.get("/api/cctv").status_code == 501
    assert client.get("/api/cctv/video").status_code == 501
    assert client.get("/api/traffic/congestion").status_code == 501
