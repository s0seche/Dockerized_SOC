# Dockerized SOC

## 📦 Cartographie des services SOC

| Service       | Rôle                 | Description                                |
| ------------- | -------------------- | ------------------------------------------ |
| TheHive       | 🐝 Incident Response | Gestion des alertes, cas et investigations |
| Cassandra     | 🗄️ Base NoSQL       | Stockage des données TheHive               |
| Elasticsearch | 🔍 Moteur            | Indexation et stockage des logs            |
| Kibana        | 📊 SIEM              | Visualisation et analyse                   |
| MinIO         | ☁️ S3                | Stockage des preuves                       |
| Cortex        | 🧠 Analyse           | Enrichissement IOC                         |
| MISP          | 🌐 TI                | Threat Intelligence                        |
| MySQL         | 🗄️ DB               | Base MISP                                  |
| Redis         | ⚡ Cache              | Queue & cache                              |

---

## 🧱 Architecture

```text
[Clients] → Beats (Filebeat / Auditbeat / Packetbeat)
        ↓
   Elasticsearch → Kibana
        ↓
   TheHive ↔ Cortex ↔ MISP
        ↓
        MinIO
```

---

## 🔐 Comptes (LAB)


| Service | Login                                             | Password      |
| ------- | ------------------------------------------------- | ------------- |
| MISP    | [mispadmin@lab.local](mailto:mispadmin@lab.local) | mispadminpass |
| MinIO   | minioadmin                                        | minioadmin    |
| MySQL   | root / mispuser                                   | misppass      |



---

## 📊 Agents

* Filebeat → logs
* Auditbeat → activité système
* Packetbeat → trafic réseau

---

## 🔎 Cas d’usage

* Détection brute force SSH
* Centralisation logs Linux / Windows
* Analyse IOC via Cortex
* Enrichissement via MISP
* Visualisation via Kibana

---

## 📌 TODO

| Domaine    | Tâche                                    | Statut |
| ---------- | ---------------------------------------- | ------ |
| 🖥️ Agents | Client Linux                             | ✅      |
| 🖥️ Agents | Client Windows                           | ✅      |
| 🖥️ Agents | Filebeat installé                        | ✅      |
| 🖥️ Agents | Auditbeat installé                       | ✅      |
| 🖥️ Agents | Packetbeat installé                      | ✅      |
| 🖥️ Agents | Remontée logs OK                         | ✅      |
| 📊 ELK     | Elasticsearch opérationnel               | ✅      |
| 📊 ELK     | Kibana opérationnel                      | ✅      |
| 📊 ELK     | Vérifier indexation logs                 |  ✅      |
| 📊 ELK     | Créer dashboards                         | ⏳      |
| 📊 ELK     | Créer règles détection                   | ⏳      |
| 📊 ELK     | Mettre en place alertes                  | ⏳      |
| 🧠 Cortex  | Installation Cortex                      | ✅      |
| 🧠 Cortex  | Tester les analyzers                     | ⏳      |
| 🐝 TheHive | Connexion TheHive ↔ Cortex               | ⏳      |
| 🐝 TheHive | Connexion TheHive ↔ Elasticsearch        | ⏳      |
| 🐝 TheHive | Automatisation alertes Elastic → TheHive | ⏳      |
| 🧪 Tests   | Générer événements (ssh fail, scan)      | ⏳      |
| 🧪 Tests   | Vérifier détection Kibana                | ⏳      |
| 🧪 Tests   | Vérifier remontée TheHive                | ⏳      |

---

## 📈 État du projet

* TheHive : ✅
* Cortex : ⚙️ (90%)
* MISP : ✅
* ELK : ⚙️ en cours

- **Progression globale de l'Architecture : ~65%**
- **Progression globale : ~45%**

---
💡 Architecture volontairement simplifiée (sans Logstash), évolutive vers une pipeline SIEM complète.

