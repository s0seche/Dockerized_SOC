import asyncio
from datetime import datetime
from fastapi import APIRouter, Query
from ..services import elastic_service, thehive_service

router = APIRouter(prefix="/api")


def _ts_sort_key(x) -> float:
    ts = x.get("timestamp")
    if ts is None:
        return 0.0
    if isinstance(ts, (int, float)):
        return float(ts)
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp() * 1000
    except (ValueError, AttributeError):
        return 0.0


@router.get("/alerts/elastic")
async def elastic_alerts(size: int = Query(50, ge=1, le=500)):
    return await elastic_service.get_alerts(size=size)


@router.get("/alerts/thehive")
async def thehive_alerts():
    alerts = await thehive_service.get_alerts()
    cases = await thehive_service.get_cases()
    return {"alerts": alerts, "cases": cases, "total": len(alerts) + len(cases)}


@router.get("/alerts")
async def all_alerts(size: int = Query(50, ge=1, le=500)):
    elastic_data, thehive_alerts, thehive_cases = await asyncio.gather(
        elastic_service.get_alerts(size=size),
        thehive_service.get_alerts(),
        thehive_service.get_cases(),
    )
    combined = elastic_data.get("alerts", []) + thehive_alerts + thehive_cases
    combined.sort(key=_ts_sort_key, reverse=True)
    return {
        "total": elastic_data.get("total", 0) + len(thehive_alerts),
        "alerts": combined,
        "severity_breakdown": elastic_data.get("severity_breakdown", {}),
    }
