# Dockerized SOC

A fully containerized Security Operations Center (SOC) stack deployable with a single `docker compose up`.

## Stack

| Service | Image | Port |
|---|---|---|
| Elasticsearch | `elasticsearch:7.17.9` | 9200 |
| Kibana | `kibana:7.17.9` | 5601 |
| Logstash | `logstash:7.17.9` | 5044 |
| Filebeat | `filebeat:7.17.9` | — |
| TheHive | `strangebee/thehive:5.2` | 9003 |
| Cortex | custom build | 9002 |
| MISP | `misp-docker/misp-core:latest` | 80 / 443 |
| MinIO | `quay.io/minio/minio` | 9000 / 9001 |
| SOC Backend | custom build (FastAPI) | 9101 |
| SOC Frontend | custom build (React + Vite) | 9100 |

## Architecture

```
Linux Agents (Filebeat)
        │
        ▼
   Logstash :5044
        │
        ▼
Elasticsearch :9200 ◄──── Kibana :5601
        │
        ├──► TheHive :9003 ◄──► Cortex :9002
        │         │
        │         └──► MISP :443
        │
        └──► SOC Backend :9101 ◄──► SOC Frontend :9100
```

## Prerequisites

- Docker >= 24.0
- Docker Compose >= 2.0
- ~8 GB RAM available for containers

## Quick Start

**1. Clone and configure**
```bash
git clone https://github.com/s0seche/Dockerized_SOC.git
cd Dockerized_SOC

# Copy the env template and fill in your values
cp .env.example .env
```

**2. (Optional) Initialize Cortex analyzers**
```bash
git clone https://github.com/TheHive-Project/Cortex-Analyzers.git cortex_analyzer/Cortex-Analyzers
```

**3. Start the stack**
```bash
docker compose up -d
```

**4. (Optional) Inject test data into Elasticsearch**
```bash
python3 scripts/generate_events.py all
```

## Configuration

Copy `.env.example` to `.env` and set your values:

```env
ELASTIC_URL=http://elasticsearch:9200
KIBANA_URL=http://kibana:5601
THEHIVE_URL=http://thehive:9000
THEHIVE_USERNAME=<your-username>
THEHIVE_PASSWORD=<your-password>
CORTEX_URL=http://cortex:9001
KIBANA_API_KEY=
THEHIVE_API_KEY=
CORTEX_API_KEY=
```

> The SOC backend reads this file at startup via `env_file: .env` in `docker-compose.yml`.

## Linux Agent

Deploy Filebeat on Linux endpoints to forward logs to Logstash:

```bash
cd agent_linux
chmod +x install_beat.sh
sudo ./install_beat.sh
```

See [`agent_linux/README.md`](agent_linux/README.md) for details.

## Service URLs

| Service | URL | Default credentials |
|---|---|---|
| Kibana | http://localhost:5601 | — |
| TheHive | http://localhost:9003 | admin@thehive.local / secret |
| Cortex | http://localhost:9002 | (first-run setup) |
| MISP | https://localhost | admin@admin.test / admin |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| SOC Dashboard | http://localhost:9100 | — |
| SOC API | http://localhost:9101/docs | — |

## Cortex — Troubleshooting

If analyzers fail to run, fix the jobs directory permissions:
```bash
chmod 777 /tmp/cortex-jobs
chown -R 1000:1000 /tmp/cortex-jobs
```

## Project Structure

```
Dockerized_SOC/
├── agent_linux/        # Filebeat agent for Linux hosts
├── backend/            # FastAPI SOC backend
├── cortex/             # Cortex Dockerfile + application.conf
├── cortex_analyzer/    # Cortex-Analyzers subdir (git-ignored)
├── filebeat/           # Filebeat config for Docker log collection
├── frontend/           # React + Vite SOC dashboard
├── logstash/           # Logstash pipeline configs
├── scripts/            # Test data generation scripts
└── docker-compose.yml  # Main stack definition
```

## License

[MIT](LICENSE)
