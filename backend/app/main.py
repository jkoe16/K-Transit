import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import bus, regions, routes, statistics, subway

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


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "services": {
            "stcis": "configured" if settings.stcis_api_key else "not_configured",
            "subway": "not_integrated",
            "route_search": "not_integrated",
            "bus_positions": "not_integrated",
            "bus_arrivals": "not_integrated",
            "subway_timetable": "not_integrated",
        },
    }
