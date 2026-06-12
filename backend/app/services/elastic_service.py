import httpx
from ..config import settings

SIGNALS_INDEX = ".siem-signals-default*"


async def get_health() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.elastic_url}/_cluster/health")
            data = r.json()
            return {
                "status": "connected",
                "cluster": data.get("cluster_name"),
                "health": data.get("status"),
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}


async def get_alerts(size: int = 50) -> dict:
    query = {
        "size": size,
        "sort": [{"@timestamp": {"order": "desc"}}],
        "query": {"match_all": {}},
        "aggs": {
            "severity_breakdown": {
                "terms": {"field": "signal.rule.severity", "size": 10}
            },
            "status_breakdown": {
                "terms": {"field": "signal.status", "size": 10}
            },
        },
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{settings.elastic_url}/{SIGNALS_INDEX}/_search",
                json=query,
                headers={"Content-Type": "application/json"},
            )
            data = r.json()
            hits = data.get("hits", {})
            raw_hits = hits.get("hits", [])
            aggs = data.get("aggregations", {})

            alerts = []
            for h in raw_hits:
                src = h.get("_source", {})
                signal = src.get("signal", {})
                rule = signal.get("rule", {})
                alerts.append({
                    "id": h.get("_id"),
                    "timestamp": src.get("@timestamp"),
                    "rule_name": rule.get("name", "Unknown"),
                    "severity": rule.get("severity", "unknown"),
                    "risk_score": rule.get("risk_score", 0),
                    "status": signal.get("status", "open"),
                    "host": src.get("host", {}).get("name") or src.get("host", {}).get("hostname"),
                    "source_ip": src.get("source", {}).get("ip") or src.get("source.ip"),
                    "dest_ip": src.get("destination", {}).get("ip") or src.get("destination.ip"),
                    "user": src.get("user", {}).get("name"),
                    "message": src.get("message"),
                    "tags": rule.get("tags", []),
                    "source": "elastic",
                })

            sev_buckets = {
                b["key"]: b["doc_count"]
                for b in aggs.get("severity_breakdown", {}).get("buckets", [])
            }
            status_buckets = {
                b["key"]: b["doc_count"]
                for b in aggs.get("status_breakdown", {}).get("buckets", [])
            }

            return {
                "total": hits.get("total", {}).get("value", 0),
                "alerts": alerts,
                "severity_breakdown": sev_buckets,
                "status_breakdown": status_buckets,
            }
    except Exception as e:
        return {"total": 0, "alerts": [], "error": str(e)}


async def get_indices() -> list:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.elastic_url}/_cat/indices?format=json&h=index,docs.count,store.size,health")
            return r.json()
    except Exception:
        return []
