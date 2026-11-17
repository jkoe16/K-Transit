from typing import Any

from fastapi import APIRouter

from app.services.provider_catalog import get_provider_catalog

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("")
async def list_providers() -> dict[str, Any]:
    return {"providers": get_provider_catalog()}
