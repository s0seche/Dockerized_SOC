import asyncio
from fastapi import APIRouter
from ..services import elastic_service, kibana_service, thehive_service, cortex_service

router = APIRouter(prefix="/api")


@router.get("/dashboard/summary")
async def summary():
    elastic_data, rules_data, thehive_alerts, thehive_cases, services = await asyncio.gather(
        elastic_service.get_alerts(size=100),
        kibana_service.get_rules(),
        thehive_service.get_alerts(),
        thehive_service.get_cases(),
        _services_status(),
    )
    sev = elastic_data.get("severity_breakdown", {})
    return {
        "total_alerts": elastic_data.get("total", 0),
        "active_rules": len(rules_data.get("active", [])),
        "disabled_rules": len(rules_data.get("disabled", [])),
        "critical_alerts": sev.get("critical", 0),
        "high_alerts": sev.get("high", 0),
        "medium_alerts": sev.get("medium", 0),
        "low_alerts": sev.get("low", 0),
        "open_cases": len([c for c in thehive_cases if c.get("status") != "Resolved"]),
        "thehive_alerts": len(thehive_alerts),
        "connector_status": services,
    }


@router.get("/soc/flow")
async def soc_flow():
    elastic_data, rules_data, thehive_alerts, thehive_cases, services = await asyncio.gather(
        elastic_service.get_alerts(size=10),
        kibana_service.get_rules(),
        thehive_service.get_alerts(limit=10),
        thehive_service.get_cases(limit=10),
        _services_status(),
    )
    recent = elastic_data.get("alerts", [])[:5]
    sev = elastic_data.get("severity_breakdown", {})
    return {
        "sources": [
            {"name": "Elasticsearch", "status": services.get("elasticsearch", {}).get("status"), "type": "es"},
            {"name": "Kibana", "status": services.get("kibana", {}).get("status"), "type": "kibana"},
            {"name": "TheHive", "status": services.get("thehive", {}).get("status"), "type": "thehive"},
            {"name": "Client Debian", "ip": "192.168.1.177", "status": "monitored", "type": "endpoint"},
        ],
        "rules": {
            "active": len(rules_data.get("active", [])),
            "disabled": len(rules_data.get("disabled", [])),
            "list": [{"name": r["name"], "severity": r["severity"]} for r in rules_data.get("active", [])],
        },
        "alerts": {
            "total": elastic_data.get("total", 0),
            "severity": sev,
            "recent": recent,
        },
        "incidents": {
            "cases": len(thehive_cases),
            "thehive_alerts": len(thehive_alerts),
            "recent": thehive_cases[:3],
        },
    }


async def _services_status() -> dict:
    elastic, kibana, thehive, cortex = await asyncio.gather(
        elastic_service.get_health(),
        kibana_service.get_health(),
        thehive_service.get_health(),
        cortex_service.get_health(),
    )
    return {
        "elasticsearch": elastic,
        "kibana": kibana,
        "thehive": thehive,
        "cortex": cortex,
    }
