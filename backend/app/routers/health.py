import asyncio
from fastapi import APIRouter
from ..services import elastic_service, kibana_service, thehive_service, cortex_service

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "soc-backend"}


@router.get("/api/health/services")
async def services_health():
    elastic, kibana, thehive, cortex = await asyncio.gather(
        elastic_service.get_health(),
        kibana_service.get_health(),
        thehive_service.get_health(),
        cortex_service.get_health(),
    )
    all_ok = all(
        s.get("status") == "connected"
        for s in [elastic, kibana, thehive, cortex]
    )
    return {
        "overall": "ok" if all_ok else "degraded",
        "services": {
            "elasticsearch": elastic,
            "kibana": kibana,
            "thehive": thehive,
            "cortex": cortex,
        },
    }
