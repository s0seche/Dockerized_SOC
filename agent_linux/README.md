# Script

Le script `.sh` permet d’installer rapidement **Filebeat** sur une machine cliente **basée sur Debian**.

---

# Fichier `.yml`

Le fichier **YAML** permet de configurer et de lancer l’agent Filebeat sur le poste du client.

**Attention** : il est impératif de modifier les lignes suivantes et de préciser l’adresse IP du serveur **Elastic**.

```yaml
# Kibana
# Dans la partie Kibana du fichier YAML
host: "IP:5601"

# Elasticsearch
output.elasticsearch:
  hosts: ["IP:9200"]
```

---

# Commandes utiles

```bash
sudo filebeat test config     # Vérification de la configuration
sudo filebeat test output     # Vérification de la connexion
sudo filebeat setup           # Chargement de la configuration
sudo systemctl restart filebeat   # Redémarrage du service Filebeat
sudo systemctl enable filebeat    # Activation de Filebeat au démarrage de la machine
```

