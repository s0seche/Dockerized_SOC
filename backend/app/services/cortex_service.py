import httpx
from ..config import settings


def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if settings.cortex_api_key:
        h["Authorization"] = f"Bearer {settings.cortex_api_key}"
    return h


async def get_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.cortex_url}/api/status", headers=_headers())
            if r.status_code == 200:
                data = r.json()
                return {
                    "status": "connected",
                    "version": data.get("versions", {}).get("Cortex", "unknown"),
                }
            return {"status": "error", "message": f"HTTP {r.status_code}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
