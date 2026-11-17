from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_unconfigured_providers_without_secrets():
    response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["services"]["subway"] == "not_integrated"
    assert "api_key" not in str(body).lower()


def test_stcis_endpoint_reports_missing_key(monkeypatch):
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "stcis_api_key", "")
    response = client.get("/api/regions")

    assert response.status_code == 503
    assert "STCIS_API_KEY" in response.json()["detail"]


def test_unintegrated_routes_do_not_return_placeholder_data():
    response = client.get("/api/subway/stations")

    assert response.status_code == 501
    assert "연동되지 않았습니다" in response.json()["detail"]


def test_bus_stop_search_requires_a_search_condition():
    response = client.get("/api/bus/stops")

    assert response.status_code == 422
