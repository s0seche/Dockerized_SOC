# 🛡️ Dockerized SOC

Une plateforme SOC complète, conteneurisée avec Docker, où le SIEM, la réponse aux incidents et la threat intelligence sont entièrement interconnectés.

---

## 🗺️ Architecture

```
                        ┌─────────────────────────────────────────────┐
                        │              Réseau Docker (soc_net)         │
                        │                                              │
  Logs/Events           │   Filebeat ──▶ Elasticsearch                │
  ──────────────────▶   │                     │                        │
                        │                 Kibana (SIEM)                │
                        │                     │                        │
                        │   TheHive ◀──▶ Cortex ◀──▶ Elasticsearch    │
                        │      │                                       │
                        │    MISP (Threat Intel)                       │
                        │      │                                       │
                        │    MinIO (Stockage S3)                       │
                        └─────────────────────────────────────────────┘
```

---

## 📦 Services

| Service | Rôle | URL |
|---|---|---|
| **TheHive** | Gestion d'incidents SOC (alertes, cas, tâches, observables) | `http://IP:9003` |
| **Cortex** | Analyse automatique d'IOC (VirusTotal, WHOIS, YARA, etc.) | `http://IP:9002` |
| **MISP** | Threat Intelligence & partage d'IOC | `https://IP` |
| **Kibana** | SIEM — dashboards et visualisation des logs | `http://IP:5601` |
| **Elasticsearch** | Indexation & recherche (TheHive, Cortex, Kibana) | `http://IP:9200` |
| **Filebeat** | Collecte des logs Docker/système → Elasticsearch direct | Interne |
| **MinIO** | Stockage S3 des pièces jointes et artefacts | API `:9000` / Console `:9001` |
| **Cassandra** | Base NoSQL — données TheHive | Interne `:9042` |

---

## ⚙️ Prérequis

- Docker >= 24.x
- Docker Compose >= 2.x
- RAM recommandée : **8 Go minimum** (Elasticsearch + Cassandra sont gourmands)
- Système : Linux (testé sur Ubuntu 22.04/24.04)

---

## 🚀 Installation

### 1. Cloner le repo

```bash
git clone https://github.com/s0seche/Dockerized_SOC.git
cd Dockerized_SOC
```

### 2. Préparer les dossiers nécessaires

```bash
# Dossier des jobs Cortex (persistant entre les reboots)
sudo mkdir -p /opt/cortex-jobs
sudo chmod 777 /opt/cortex-jobs
sudo chown -R 1000:1000 /opt/cortex-jobs
```

> ⚠️ **Ne pas utiliser `/tmp/cortex-jobs`** — ce dossier est vidé à chaque reboot, ce qui casse Cortex au redémarrage.

### 3. Lancer la stack

```bash
sudo docker compose up -d
```

### 4. Vérifier que tous les services sont UP

```bash
sudo docker compose ps
```

---

## 🔐 Identifiants par défaut

| Service | Login | Mot de passe |
|---|---|---|
| **TheHive** | `admin@thehive.local` | `lab123456789` |
| **Cortex** | `admin` | (défini au premier lancement) |
| **MISP** | `mispadmin@lab.local` | `mispadminpass` |
| **MinIO** | `minioadmin` | `minioadmin` |
| **MySQL (MISP)** | `root` / `mispuser` | `misppass` |

> ⚠️ Changer tous les mots de passe en production.

---

## 🔗 Intégration TheHive ↔ Cortex

Pour que TheHive puisse lancer des analyzers depuis les observables, il faut connecter les deux services.

### 1. Créer une API Key dans Cortex

1. Connecte-toi à Cortex → **Organization → Users**
2. Sélectionne un user avec le rôle **`orgadmin`** (ex: `jb1` dans l'org `DEMO`)
3. Clique **Create API Key** → **Reveal** → copie la clé

### 2. Configurer dans TheHive

1. **Gestion de la Plateforme → Cortex → Servers → Ajouter**
2. Renseigne :
   - **URL** : `http://cortex:9001` ← port **interne** Docker (pas le 9002 exposé)
   - **Clef d'API** : la clé copiée à l'étape précédente
3. **Teste la connexion** → doit afficher `success`
4. **Mettre à jour** puis `docker restart thehive`

> 💡 **Pourquoi `cortex:9001` et pas `192.168.x.x:9002` ?**
> TheHive et Cortex sont dans le même réseau Docker. Ils communiquent via le nom de service et le port **interne** du container. Le port `9002` n'est exposé que pour ton navigateur.

### 3. Activer les analyzers dans Cortex

1. **Organization → Analyzers** → activer les analyzers souhaités (ex: VirusTotal)
2. Configurer les clés API nécessaires (ex: clé VirusTotal)

---

## 🐛 Dépannage courant

### Cortex — `AUTH_ERR` dans TheHive Status

L'API Key est invalide ou appartient à un user sans les bons droits.
→ Regénère une clé depuis un user `orgadmin` dans Cortex.

### Cortex — Jobs en `Failure` au redémarrage

Le dossier `/tmp/cortex-jobs` a été supprimé au reboot.
```bash
sudo mkdir -p /opt/cortex-jobs
sudo chmod 777 /opt/cortex-jobs
sudo chown -R 1000:1000 /opt/cortex-jobs
```
Et mettre à jour `cortex/application.conf` :
```hocon
job {
  runner = [process]
  directory = /opt/cortex-jobs
}
```

### Erreur au démarrage de Filebeat

```bash
sudo rm -rf filebeat/filebeat.yml
sudo nano filebeat/filebeat.yml
```
Coller :
```yaml
filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```
```bash
sudo docker compose up -d
```

### TheHive ne voit pas les analyzers

- Vérifie que Cortex répond sur `http://cortex:9001/api/status` depuis le container TheHive :
  ```bash
  docker exec -it thehive curl http://cortex:9001/api/status
  ```
- Vérifie que des analyzers sont bien **activés** dans Cortex (Organization → Analyzers)
- Vérifie les logs :
  ```bash
  docker logs thehive 2>&1 | grep -i cortex
  docker logs cortex 2>&1 | grep -i error
  ```

---

## 📁 Structure du projet

```
Dockerized_SOC/
├── docker-compose.yml        # Définition de tous les services
├── cortex/
│   ├── Dockerfile            # Image Cortex custom (Python + pip)
│   └── application.conf      # Config Cortex (Elasticsearch, analyzers, jobs)
├── cortex_analyzer/
│   └── Cortex-Analyzers/     # Analyzers (VirusTotal, MISP, etc.)
├── filebeat/
│   └── filebeat.yml          # Config collecte de logs
├── agent_linux/              # Agent de collecte Linux
└── README.md
```

---

## 🗺️ Flux de données SOC

```
Endpoints (Linux/Windows)
        │
        ▼
    Filebeat  ──▶  Elasticsearch  ──▶  Kibana
                                        │
                                    TheHive
                                   (Alertes / Cas)
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼              ▼
                       Cortex         MISP         MinIO
                    (Analyzers)  (Threat Intel)  (Artefacts)
```

---

## 📋 To Do

- [x] Stack SOC de base (TheHive + Cortex + Elastic + MISP)
- [x] Intégration TheHive ↔ Cortex (analyzers depuis les observables)
- [ ] Création des dashboards Kibana
- [ ] Génération de données de test (simulation d'attaques / IOC )



