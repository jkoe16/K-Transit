import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import bus, cctv, providers, regions, routes, statistics, subway, traffic
from app.services.provider_status import get_provider_status

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="K-Transit API",
    description="전국 대중교통 데이터의 내부 API 및 공공데이터 연동",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(regions.router)
app.include_router(bus.router)
app.include_router(subway.router)
app.include_router(routes.router)
app.include_router(statistics.router)
app.include_router(traffic.router)
app.include_router(cctv.router)
app.include_router(providers.router)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
async def health() -> dict[str, object]:
    services = {
        "stcis_regions": get_provider_status(
            "stcis_regions", configured=bool(settings.stcis_api_key)
        ),
        "stcis_bus_stops": get_provider_status(
            "stcis_bus_stops", configured=bool(settings.stcis_api_key)
        ),
        "stcis_bus_routes": get_provider_status(
            "stcis_bus_routes", configured=bool(settings.stcis_api_key)
        ),
        "stcis_statistics": get_provider_status(
            "stcis_statistics", configured=bool(settings.stcis_api_key)
        ),
        "bus_arrivals": get_provider_status(
            "bus_arrivals", configured=bool(settings.tago_api_key)
        ),
        "bus_arrival_cities": get_provider_status(
            "bus_arrival_cities", configured=bool(settings.tago_api_key)
        ),
        "tago_bus_positions": get_provider_status(
            "tago_bus_positions",
            configured=bool(settings.tago_api_key),
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "klid_bus_positions": get_provider_status(
            "klid_bus_positions",
            configured=bool(settings.klid_api_key),
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "its_traffic_speed": get_provider_status(
            "its_traffic_speed", configured=bool(settings.traffic_api_key)
        ),
        "its_traffic_events": get_provider_status(
            "its_traffic_events", configured=bool(settings.traffic_api_key)
        ),
        "its_traffic_congestion": get_provider_status(
            "its_traffic_congestion",
            configured=bool(settings.traffic_api_key),
            integrated=False,
        ),
        "cctv_location": get_provider_status(
            "cctv_location",
            configured=False,
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "cctv_video": get_provider_status(
            "cctv_video",
            configured=False,
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "bus_positions": get_provider_status(
            "bus_positions",
            configured=False,
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "subway": get_provider_status(
            "subway",
            configured=False,
            integrated=False,
            unintegrated_status="endpoint_unknown",
        ),
        "route_search": get_provider_status(
            "route_search", configured=False, integrated=False
        ),
    }
    return {
        "status": "ok",
        "services": services,
    }
