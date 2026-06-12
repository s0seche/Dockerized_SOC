from fastapi import APIRouter
from ..services import kibana_service

router = APIRouter(prefix="/api")


@router.get("/rules")
async def get_rules():
    return await kibana_service.get_rules()


@router.get("/rules/active")
async def get_active_rules():
    data = await kibana_service.get_rules()
    return {"total": len(data["active"]), "rules": data["active"]}
