# Dockerized_SOC


## 📦 Cartographie des services SOC

| **Service**       | **Rôle principal**         | **À quoi ça sert concrètement**                                                              | **Accès / URL**                                                                                               |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **thehive**       | 🐝 Gestion d’incidents SOC | Cœur du SOC : gestion des alertes, incidents, cas, tâches, observables et workflows          | 🌐 [http://localhost:9003](http://localhost:9003)                                                             |
| **cassandra**     | 🗄️ Base NoSQL             | Stockage principal des données métier de TheHive (cas, observables, utilisateurs, relations) | 🔒 Interne Docker (`cassandra:9042`)                                                                          |
| **elasticsearch** | 🔍 Moteur de recherche     | Indexation & recherche pour TheHive, Cortex, Logstash et Kibana                              | 🌐 [http://localhost:9200](http://localhost:9200)                                                             |
| **kibana**        | 📊 Visualisation & SIEM    | Dashboards, recherche, visualisation des logs et données Elasticsearch                       | 🌐 [http://localhost:5601](http://localhost:5601)                                                             |
| **logstash**      | 🔄 Pipeline de logs        | Réception, parsing, enrichissement et envoi des logs vers Elasticsearch                      | 🔒 Interne (`5044` exposé pour Filebeat)                                                                      |
| **filebeat**      | 📥 Collecte de logs        | Collecte des logs Docker / système et envoi vers Logstash                                    | 🔒 Interne Docker                                                                                             |
| **minio**         | ☁️ Stockage objet (S3)     | Stockage des pièces jointes, preuves et artefacts TheHive                                    | API : [http://localhost:9000](http://localhost:9000) Console : [http://localhost:9001](http://localhost:9001) |
| **cortex**        | 🧠 Analyse automatique     | Exécution d’analyseurs (VT, YARA, WHOIS, IP, hash, etc.) depuis TheHive                      | 🌐 [http://localhost:9002](http://localhost:9002)                                                             |
| **misp**          | 🌐 Threat Intelligence     | Partage, corrélation et enrichissement d’IOC (hash, IP, domaines, TTP, événements)           | 🌐 [https://localhost](https://localhost)                                                                     |
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
    

