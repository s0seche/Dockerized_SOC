#!/usr/bin/env python3
"""
Crée et importe deux dashboards Kibana 7.17.9 via l'API saved objects.
- Dashboard 1 : Vue générale SOC
- Dashboard 2 : Détection Bruteforce SSH
"""
import json
import urllib.request
import urllib.error
import sys

KIBANA = "http://localhost:5601"
HEADERS = {"kbn-xsrf": "true", "Content-Type": "application/json"}


def kibana_post(path, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{KIBANA}{path}", data=data, headers=HEADERS, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERROR {e.code} on {path}: {body[:300]}", file=sys.stderr)
        return None


def vs(obj):
    """Sérialise un dict en JSON string (visState format)."""
    return json.dumps(obj)


def search_source(index_id, filters=None):
    """Génère le searchSourceJSON."""
    obj = {
        "query": {"query": "", "language": "kuery"},
        "filter": filters or [],
        "indexRefName": "kibanaSavedObjectMeta.searchSourceJSON.index"
    }
    return json.dumps(obj)


def search_source_no_index(filters=None):
    """SearchSource sans référence d'index (pour dashboards)."""
    return json.dumps({
        "query": {"query": "", "language": "kuery"},
        "filter": filters or []
    })


# ─── Helpers visState ─────────────────────────────────────────────────────────

def vis_metric(title, label="Count", color="Green to Red"):
    return vs({
        "title": title,
        "type": "metric",
        "aggs": [{"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}}],
        "params": {
            "addTooltip": True, "addLegend": False, "type": "metric",
            "metric": {
                "percentageMode": False, "useRanges": False,
                "colorSchema": color, "metricColorMode": "None",
                "colorsRange": [{"from": 0, "to": 10000}],
                "labels": {"show": True}, "invertColors": False,
                "style": {"bgFill": "#000", "bgColor": False, "labelColor": False,
                          "subText": label, "fontSize": 60}
            }
        }
    })


def vis_area_time(title, filters=None):
    vis_filters = []
    if filters:
        for f in filters:
            vis_filters.append(f)
    return vs({
        "title": title,
        "type": "area",
        "aggs": [
            {"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}},
            {"id": "2", "enabled": True, "type": "date_histogram", "schema": "segment",
             "params": {"field": "@timestamp", "useNormalizedEsInterval": True,
                        "scaleMetricValues": False, "interval": "auto",
                        "drop_partials": False, "min_doc_count": 1, "extended_bounds": {}}}
        ],
        "params": {
            "type": "area",
            "grid": {"categoryLines": False},
            "categoryAxes": [{"id": "CategoryAxis-1", "type": "category", "position": "bottom",
                               "show": True, "style": {}, "scale": {"type": "linear"},
                               "labels": {"show": True, "filter": True, "truncate": 100}, "title": {}}],
            "valueAxes": [{"id": "ValueAxis-1", "name": "LeftAxis-1", "type": "value",
                           "position": "left", "show": True, "style": {},
                           "scale": {"type": "linear", "mode": "normal"},
                           "labels": {"show": True, "rotate": 0, "filter": False, "truncate": 100},
                           "title": {"text": "Événements"}}],
            "seriesParams": [{"show": True, "type": "area", "mode": "stacked",
                              "data": {"label": "Événements", "id": "1"},
                              "drawLinesBetweenPoints": True, "lineWidth": 2,
                              "showCircles": True, "interpolate": "linear", "valueAxis": "ValueAxis-1"}],
            "addTooltip": True, "addLegend": True, "legendPosition": "right",
            "times": [], "addTimeMarker": False,
            "thresholdLine": {"show": False, "value": 10, "width": 1, "style": "full", "color": "#E7664C"}
        }
    })


def vis_bar_terms(title, field, size=10):
    return vs({
        "title": title,
        "type": "histogram",
        "aggs": [
            {"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}},
            {"id": "2", "enabled": True, "type": "terms", "schema": "segment",
             "params": {"field": field, "orderBy": "1", "order": "desc", "size": size,
                        "otherBucket": False, "otherBucketLabel": "Other",
                        "missingBucket": False, "missingBucketLabel": "Missing"}}
        ],
        "params": {
            "type": "histogram",
            "grid": {"categoryLines": False},
            "categoryAxes": [{"id": "CategoryAxis-1", "type": "category", "position": "bottom",
                               "show": True, "style": {}, "scale": {"type": "linear"},
                               "labels": {"show": True, "filter": True, "truncate": 100}, "title": {}}],
            "valueAxes": [{"id": "ValueAxis-1", "name": "LeftAxis-1", "type": "value",
                           "position": "left", "show": True, "style": {},
                           "scale": {"type": "linear", "mode": "normal"},
                           "labels": {"show": True, "rotate": 0, "filter": False, "truncate": 100},
                           "title": {"text": "Count"}}],
            "seriesParams": [{"show": True, "type": "histogram", "mode": "stacked",
                              "data": {"label": "Count", "id": "1"},
                              "drawLinesBetweenPoints": True, "lineWidth": 2,
                              "showCircles": True, "valueAxis": "ValueAxis-1"}],
            "addTooltip": True, "addLegend": True, "legendPosition": "right",
            "times": [], "addTimeMarker": False,
            "thresholdLine": {"show": False, "value": 10, "width": 1, "style": "full", "color": "#E7664C"}
        }
    })


def vis_pie_terms(title, field, size=10):
    return vs({
        "title": title,
        "type": "pie",
        "aggs": [
            {"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}},
            {"id": "2", "enabled": True, "type": "terms", "schema": "segment",
             "params": {"field": field, "orderBy": "1", "order": "desc", "size": size,
                        "otherBucket": True, "otherBucketLabel": "Autres",
                        "missingBucket": False, "missingBucketLabel": "Manquant"}}
        ],
        "params": {
            "type": "pie",
            "addTooltip": True, "addLegend": True, "legendPosition": "right",
            "isDonut": True, "labels": {"show": False, "values": True, "last_level": True, "truncate": 100}
        }
    })


def vis_table(title, field, size=20):
    return vs({
        "title": title,
        "type": "table",
        "aggs": [
            {"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}},
            {"id": "2", "enabled": True, "type": "terms", "schema": "bucket",
             "params": {"field": "@timestamp", "orderBy": "1", "order": "desc", "size": size,
                        "otherBucket": False, "otherBucketLabel": "Other",
                        "missingBucket": False, "missingBucketLabel": "Missing",
                        "customLabel": "Timestamp"}},
            {"id": "3", "enabled": True, "type": "terms", "schema": "bucket",
             "params": {"field": "user.name", "orderBy": "1", "order": "desc", "size": 5,
                        "otherBucket": False, "customLabel": "Utilisateur"}},
            {"id": "4", "enabled": True, "type": "terms", "schema": "bucket",
             "params": {"field": "source.ip", "orderBy": "1", "order": "desc", "size": 5,
                        "otherBucket": False, "customLabel": "IP Source"}},
            {"id": "5", "enabled": True, "type": "terms", "schema": "bucket",
             "params": {"field": "host.name", "orderBy": "1", "order": "desc", "size": 5,
                        "otherBucket": False, "customLabel": "Hôte ciblé"}}
        ],
        "params": {
            "perPage": 10, "showPartialRows": False, "showMetricsAtAllLevels": False,
            "sort": {"columnIndex": None, "direction": None},
            "showTotal": False, "totalFunc": "sum",
            "percentageCol": ""
        }
    })


def vis_metric_filtered(title, filter_query, label=""):
    """Metric avec filtre KQL embarqué."""
    return vs({
        "title": title,
        "type": "metric",
        "aggs": [{"id": "1", "enabled": True, "type": "count", "schema": "metric", "params": {}}],
        "params": {
            "addTooltip": True, "addLegend": False, "type": "metric",
            "metric": {
                "percentageMode": False, "useRanges": False,
                "colorSchema": "Green to Red", "metricColorMode": "None",
                "colorsRange": [{"from": 0, "to": 10000}],
                "labels": {"show": True}, "invertColors": False,
                "style": {"bgFill": "#000", "bgColor": False, "labelColor": False,
                          "subText": label, "fontSize": 60}
            }
        }
    })


def search_source_filtered(index_id, filter_query):
    """SearchSource avec filtre KQL."""
    return json.dumps({
        "query": {"query": filter_query, "language": "kuery"},
        "filter": [],
        "indexRefName": "kibanaSavedObjectMeta.searchSourceJSON.index"
    })


# ─── Construction des objets ───────────────────────────────────────────────────

INDEX_REF = "auditbeat-*"

def make_viz(vid, title, vis_state_str, filter_query=""):
    src = search_source_filtered(INDEX_REF, filter_query) if filter_query else search_source(INDEX_REF)
    return {
        "type": "visualization",
        "id": vid,
        "attributes": {
            "title": title,
            "visState": vis_state_str,
            "uiStateJSON": "{}",
            "description": "",
            "kibanaSavedObjectMeta": {"searchSourceJSON": src}
        },
        "references": [
            {"name": "kibanaSavedObjectMeta.searchSourceJSON.index",
             "type": "index-pattern", "id": INDEX_REF}
        ]
    }


# ─── Visualisations Dashboard 1 : Vue générale SOC ───────────────────────────

viz_01 = make_viz("soc-viz-01", "Total Événements",
                  vis_metric("Total Événements", "tous index"))

viz_02 = make_viz("soc-viz-02", "Événements dans le temps",
                  vis_area_time("Événements dans le temps"))

viz_03 = make_viz("soc-viz-03", "Top 10 Hôtes",
                  vis_bar_terms("Top 10 Hôtes", "host.name", 10))

viz_04 = make_viz("soc-viz-04", "Top 10 Utilisateurs",
                  vis_bar_terms("Top 10 Utilisateurs", "user.name", 10))

viz_05 = make_viz("soc-viz-05", "Top 10 Processus",
                  vis_bar_terms("Top 10 Processus", "process.name", 10))

viz_06 = make_viz("soc-viz-06", "Distribution par module",
                  vis_pie_terms("Distribution par module", "event.module", 10))

viz_07 = make_viz("soc-viz-07", "Types d'événements",
                  vis_pie_terms("Types d'événements", "event.type", 10))

viz_08 = make_viz("soc-viz-08", "Actions système",
                  vis_bar_terms("Actions système", "event.action", 15))

# ─── Visualisations Dashboard 2 : Bruteforce SSH ─────────────────────────────

SSH_FAIL = "event.type: authentication_failure"
SSH_AUTH = "event.category: authentication"

viz_09 = make_viz("soc-viz-09", "Échecs d'authentification SSH",
                  vis_metric_filtered("Échecs d'authentification SSH",
                                      SSH_FAIL, "échecs"),
                  filter_query=SSH_FAIL)

viz_10 = make_viz("soc-viz-10", "Succès d'authentification SSH",
                  vis_metric_filtered("Succès d'authentification SSH",
                                      "event.type: authentication_success",
                                      "succès"),
                  filter_query="event.type: authentication_success")

viz_11 = make_viz("soc-viz-11", "Échecs SSH dans le temps",
                  vis_area_time("Échecs SSH dans le temps"),
                  filter_query=SSH_FAIL)

viz_12 = make_viz("soc-viz-12", "Top IPs Attaquantes",
                  vis_bar_terms("Top IPs Attaquantes", "source.ip", 15),
                  filter_query=SSH_FAIL)

viz_13 = make_viz("soc-viz-13", "Top Utilisateurs Ciblés",
                  vis_bar_terms("Top Utilisateurs Ciblés", "user.name", 15),
                  filter_query=SSH_FAIL)

viz_14 = make_viz("soc-viz-14", "Répartition Succès / Échecs",
                  vis_pie_terms("Répartition Succès / Échecs", "event.outcome", 5),
                  filter_query=SSH_AUTH)

viz_15 = make_viz("soc-viz-15", "Authentifications par hôte ciblé",
                  vis_bar_terms("Authentifications par hôte ciblé", "host.name", 10),
                  filter_query=SSH_AUTH)

viz_16 = make_viz("soc-viz-16", "Derniers événements SSH",
                  vis_table("Derniers événements SSH", "user.name", 20),
                  filter_query=SSH_AUTH)

# ─── Dashboard 1 panels ───────────────────────────────────────────────────────

def panel(index, viz_id, x, y, w, h, title=None):
    p = {
        "version": "7.17.9",
        "type": "visualization",
        "gridData": {"x": x, "y": y, "w": w, "h": h, "i": str(index)},
        "panelIndex": str(index),
        "embeddableConfig": {"enhancements": {}},
        "panelRefName": f"panel_{index}"
    }
    if title:
        p["title"] = title
    return p


panels_soc = [
    panel(1,  "soc-viz-01", 0,  0,  12, 8),   # Total events metric
    panel(2,  "soc-viz-06", 12, 0,  18, 8),   # Pie module
    panel(3,  "soc-viz-07", 30, 0,  18, 8),   # Pie event types
    panel(4,  "soc-viz-02", 0,  8,  48, 15),  # Area time
    panel(5,  "soc-viz-03", 0,  23, 16, 15),  # Bar hosts
    panel(6,  "soc-viz-04", 16, 23, 16, 15),  # Bar users
    panel(7,  "soc-viz-05", 32, 23, 16, 15),  # Bar processes
    panel(8,  "soc-viz-08", 0,  38, 48, 15),  # Bar actions
]

refs_soc = [
    {"name": f"panel_{i}", "type": "visualization", "id": vid}
    for i, vid in enumerate([
        "soc-viz-01", "soc-viz-06", "soc-viz-07", "soc-viz-02",
        "soc-viz-03", "soc-viz-04", "soc-viz-05", "soc-viz-08"
    ], 1)
]

dash_soc = {
    "type": "dashboard",
    "id": "soc-dash-01",
    "attributes": {
        "title": "Vue générale SOC",
        "hits": 0,
        "description": "Vue d'ensemble SOC : événements, hôtes, utilisateurs, processus (auditbeat)",
        "panelsJSON": json.dumps(panels_soc),
        "optionsJSON": json.dumps({"useMargins": True, "syncColors": False, "hidePanelTitles": False}),
        "version": 1,
        "timeRestore": False,
        "kibanaSavedObjectMeta": {"searchSourceJSON": search_source_no_index()}
    },
    "references": refs_soc
}

# ─── Dashboard 2 panels ───────────────────────────────────────────────────────

panels_ssh = [
    panel(1,  "soc-viz-09", 0,  0,  12, 8),   # Metric failures
    panel(2,  "soc-viz-10", 12, 0,  12, 8),   # Metric successes
    panel(3,  "soc-viz-14", 24, 0,  24, 8),   # Pie success/fail
    panel(4,  "soc-viz-11", 0,  8,  48, 15),  # Area failures time
    panel(5,  "soc-viz-12", 0,  23, 24, 15),  # Bar top IPs
    panel(6,  "soc-viz-13", 24, 23, 24, 15),  # Bar top users
    panel(7,  "soc-viz-15", 0,  38, 48, 12),  # Bar per host
    panel(8,  "soc-viz-16", 0,  50, 48, 18),  # Table recent events
]

refs_ssh = [
    {"name": f"panel_{i}", "type": "visualization", "id": vid}
    for i, vid in enumerate([
        "soc-viz-09", "soc-viz-10", "soc-viz-14", "soc-viz-11",
        "soc-viz-12", "soc-viz-13", "soc-viz-15", "soc-viz-16"
    ], 1)
]

dash_ssh = {
    "type": "dashboard",
    "id": "soc-dash-02",
    "attributes": {
        "title": "Détection Bruteforce SSH",
        "hits": 0,
        "description": "Monitoring SSH : échecs auth, top IPs attaquantes, utilisateurs ciblés",
        "panelsJSON": json.dumps(panels_ssh),
        "optionsJSON": json.dumps({"useMargins": True, "syncColors": False, "hidePanelTitles": False}),
        "version": 1,
        "timeRestore": False,
        "kibanaSavedObjectMeta": {"searchSourceJSON": search_source_no_index()}
    },
    "references": refs_ssh
}

# ─── Import ───────────────────────────────────────────────────────────────────

all_objects = [
    viz_01, viz_02, viz_03, viz_04, viz_05, viz_06, viz_07, viz_08,
    viz_09, viz_10, viz_11, viz_12, viz_13, viz_14, viz_15, viz_16,
    dash_soc, dash_ssh
]

print(f"Import de {len(all_objects)} objets Kibana...")

result = kibana_post(
    "/api/saved_objects/_import?overwrite=true",
    None  # multipart — on utilise _bulk_create à la place
)

# _bulk_create est plus simple pour notre usage
bulk_result = kibana_post(
    "/api/saved_objects/_bulk_create?overwrite=true",
    all_objects
)

if bulk_result is None:
    print("ERREUR lors de l'import.", file=sys.stderr)
    sys.exit(1)

saved = bulk_result.get("saved_objects", [])
ok = [o for o in saved if "error" not in o]
ko = [o for o in saved if "error" in o]

print(f"\n✓ {len(ok)} objets importés avec succès")
for o in ok:
    print(f"  [{o['type']}] {o['attributes']['title']} ({o['id']})")

if ko:
    print(f"\n✗ {len(ko)} erreurs :")
    for o in ko:
        print(f"  [{o['type']}] {o.get('id')} → {o['error']}")

print(f"\nDashboards accessibles :")
print(f"  Vue générale SOC    : http://localhost:5601/app/dashboards#/view/soc-dash-01")
print(f"  Bruteforce SSH      : http://localhost:5601/app/dashboards#/view/soc-dash-02")
