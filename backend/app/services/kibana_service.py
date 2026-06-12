import httpx
from ..config import settings


def _headers() -> dict:
    h = {"kbn-xsrf": "true", "Content-Type": "application/json"}
    if settings.kibana_api_key:
        h["Authorization"] = f"ApiKey {settings.kibana_api_key}"
    return h


async def get_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.kibana_url}/api/status", headers=_headers())
            data = r.json()
            overall = data.get("status", {}).get("overall", {})
            return {
                "status": "connected",
                "kibana_status": overall.get("state", "unknown"),
                "version": data.get("version", {}).get("number"),
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def get_rules(per_page: int = 100) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{settings.kibana_url}/api/detection_engine/rules/_find",
                params={"page": 1, "per_page": per_page},
                headers=_headers(),
            )
            data = r.json()
            rules = []
            for rule in data.get("data", []):
                rules.append({
                    "id": rule.get("id"),
                    "rule_id": rule.get("rule_id"),
                    "name": rule.get("name"),
                    "description": rule.get("description"),
                    "severity": rule.get("severity"),
                    "risk_score": rule.get("risk_score"),
                    "enabled": rule.get("enabled", False),
                    "type": rule.get("type"),
                    "tags": rule.get("tags", []),
                    "interval": rule.get("interval"),
                    "created_at": rule.get("created_at"),
                    "updated_at": rule.get("updated_at"),
                    "threat": rule.get("threat", []),
                })
            active = [r for r in rules if r["enabled"]]
            disabled = [r for r in rules if not r["enabled"]]
            return {
                "total": data.get("total", 0),
                "rules": rules,
                "active": active,
                "disabled": disabled,
            }
    except Exception as e:
        return {"total": 0, "rules": [], "active": [], "disabled": [], "error": str(e)}


async def get_dashboards(per_page: int = 200) -> list:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{settings.kibana_url}/api/saved_objects/_find",
                params={"type": "dashboard", "per_page": per_page},
                headers=_headers(),
            )
            data = r.json()
            dashboards = []
            for obj in data.get("saved_objects", []):
                attrs = obj.get("attributes", {})
                dashboards.append({
                    "id": obj.get("id"),
                    "title": attrs.get("title", "Untitled"),
                    "description": attrs.get("description", ""),
                    "url": f"{settings.kibana_url}/app/dashboards#/view/{obj.get('id')}",
                    "updated_at": obj.get("updated_at"),
                })
            return dashboards
    except Exception:
        return []
