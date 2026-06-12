import base64
import httpx
from ..config import settings


def _auth_header() -> dict:
    if settings.thehive_api_key:
        return {"Authorization": f"Bearer {settings.thehive_api_key}"}
    creds = base64.b64encode(
        f"{settings.thehive_username}:{settings.thehive_password}".encode()
    ).decode()
    return {"Authorization": f"Basic {creds}"}


def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    h.update(_auth_header())
    return h


async def get_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.thehive_url}/api/status", headers=_headers())
            data = r.json()
            versions = data.get("versions", {})
            return {
                "status": "connected",
                "version": versions.get("TheHive", "unknown"),
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def get_alerts(limit: int = 20) -> list:
    payload = {
        "query": [
            {"_name": "listAlert"},
            {"_name": "sort", "_fields": [{"_createdAt": "desc"}]},
            {"_name": "page", "from": 0, "to": limit},
        ]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{settings.thehive_url}/api/v1/query",
                json=payload,
                headers=_headers(),
            )
            data = r.json()
            if not isinstance(data, list):
                return []
            alerts = []
            for a in data:
                alerts.append({
                    "id": a.get("_id"),
                    "title": a.get("title"),
                    "description": a.get("description"),
                    "severity": _map_severity(a.get("severity", 2)),
                    "severity_level": a.get("severity"),
                    "status": a.get("status"),
                    "source": a.get("source"),
                    "source_ref": a.get("sourceRef"),
                    "tags": a.get("tags", []),
                    "timestamp": a.get("_createdAt"),
                    "updated_at": a.get("_updatedAt"),
                    "type": "alert",
                })
            return alerts
    except Exception:
        return []


async def get_cases(limit: int = 20) -> list:
    payload = {
        "query": [
            {"_name": "listCase"},
            {"_name": "sort", "_fields": [{"_createdAt": "desc"}]},
            {"_name": "page", "from": 0, "to": limit},
        ]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{settings.thehive_url}/api/v1/query",
                json=payload,
                headers=_headers(),
            )
            data = r.json()
            if not isinstance(data, list):
                return []
            cases = []
            for c in data:
                cases.append({
                    "id": c.get("_id"),
                    "number": c.get("number"),
                    "title": c.get("title"),
                    "description": c.get("description"),
                    "severity": _map_severity(c.get("severity", 2)),
                    "severity_level": c.get("severity"),
                    "status": c.get("status"),
                    "tags": c.get("tags", []),
                    "timestamp": c.get("_createdAt"),
                    "assignee": c.get("assignee"),
                    "type": "case",
                })
            return cases
    except Exception:
        return []


def _map_severity(level: int) -> str:
    mapping = {1: "low", 2: "medium", 3: "high", 4: "critical"}
    return mapping.get(level, "medium")
