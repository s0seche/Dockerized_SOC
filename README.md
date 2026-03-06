# Dockerized_SOC


## 📦 Cartographie des services SOC

| **Service**       | **Rôle principal**         | **À quoi ça sert concrètement**                                                              | **Accès / URL**                                                                                               |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **thehive**       | 🐝 Gestion d’incidents SOC | Cœur du SOC : gestion des alertes, incidents, cas, tâches, observables et workflows          | 🌐 [http://IP:9003](http://IP:9003)                                                             |
| **cassandra**     | 🗄️ Base NoSQL             | Stockage principal des données métier de TheHive (cas, observables, utilisateurs, relations) | 🔒 Interne Docker (`cassandra:9042`)                                                                          |
| **elasticsearch** | 🔍 Moteur de recherche     | Indexation & recherche pour TheHive, Cortex, Logstash et Kibana                              | 🌐 [http://IP:9200](http://IP:9200)                                                             |
| **kibana**        | 📊 Visualisation & SIEM    | Dashboards, recherche, visualisation des logs et données Elasticsearch                       | 🌐 [http://IP:5601](http://IP:5601)                                                             |
| **logstash**      | 🔄 Pipeline de logs        | Réception, parsing, enrichissement et envoi des logs vers Elasticsearch                      | 🔒 Interne (`5044` exposé pour Filebeat)                                                                      |
| **filebeat**      | 📥 Collecte de logs        | Collecte des logs Docker / système et envoi vers Logstash                                    | 🔒 Interne Docker                                                                                             |
| **minio**         | ☁️ Stockage objet (S3)     | Stockage des pièces jointes, preuves et artefacts TheHive                                    | API : [http://IP:9000](http://IP:9000) Console : [http://localhost:9001](http://localhost:9001) |
| **cortex**        | 🧠 Analyse automatique     | Exécution d’analyseurs (VT, YARA, WHOIS, IP, hash, etc.) depuis TheHive                      | 🌐 [http://IP:9002](http://IP:9002)                                                             |
| **misp**          | 🌐 Threat Intelligence     | Partage, corrélation et enrichissement d’IOC (hash, IP, domaines, TTP, événements)           | 🌐 [https://IP](https://IP)                                                                     |
| **misp_mysql**    | 🗄️ Base relationnelle     | Base de données MySQL de MISP                                                                | 🔒 Interne Docker                                                                                             |
| **redis**         | ⚡ Cache / Queue            | Cache et files d’attente pour MISP                                                           | 🔒 Interne Docker                                                                                             |

---

## 🔐 Comptes & identifiants

| Service     | Identifiant                                       | Mot de passe     |
| ----------- | ------------------------------------------------- | ---------------- |
| **TheHive** | [admin@thehive.local](mailto:admin@thehive.local) | **lab123456789** |
| **MISP**    | [mispadmin@lab.local](mailto:mispadmin@lab.local) | mispadminpass    |
| **MinIO**   | minioadmin                                        | minioadmin       |
| **MySQL**   | root / mispuser                                   | misppass         |

---

## 🧠 Lecture SOC 

- **TheHive** 🐝  
    → Centre de commandement SOC (incidents, investigations)
    
- **Cortex** 🧠  
    → Automatisation & enrichissement (appelé depuis TheHive)
    
- **MISP** 🌐  
    → Threat Intelligence & partage d’IOC
    
- **Elastic + Logstash + Filebeat + Kibana** 📊  
    → Pipeline logs & SIEM (collecte → parsing → indexation → visualisation)
    
- **MinIO** ☁️  
    → Stockage S3 des preuves et fichiers
    
---
# Lancement et debug

```bash
$ sudo docker compose up -d 
```
Si erreur au démarage :
```bash
$ sudo rm -rf filebeat/filebeat.yml
$ sudo nano filebeat/filebeat.yml
# Puis coller le contenu suivant:
filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log

output.logstash:
  hosts: ["logstash:5044"]

$ sudo docker compose up -d 

```
---
# To do 

- Créé l'infra du client 
	- AD
	- CRM
	- Intranet ( *optionel* )
- Crée poste client         - ***Xavier***
	- Client Windows 
	- Client Linux
- Crée agent 
	- **Agent Linux -> ok** 
	- Agent Windows
	- Agent SRV
- Déploiement sur Azure
    - Postes clients        - ***Xavier***
    - Agents 
    - infra

