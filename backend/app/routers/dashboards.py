from fastapi import APIRouter
from ..services import kibana_service
from ..config import settings

router = APIRouter(prefix="/api")


@router.get("/dashboards")
async def get_dashboards():
    dashboards = await kibana_service.get_dashboards()
    return {
        "total": len(dashboards),
        "dashboards": dashboards,
        "kibana_url": settings.kibana_url.replace("kibana", "192.168.1.129").replace(":5601", ":5601"),
    }
