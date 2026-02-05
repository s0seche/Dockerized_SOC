# Script 

Le script .sh permet d'installer rapidement filebeat sur une machine **basé sur Debian**

# Fichier .yml

Le fichier YAML est ce fichier qui va permettre de lançer l'agent sur le poste du client.
**Attention** il faut bien penser modifier la ligne
```YAML 
output.elasticsearch:
  hosts: ["IP:9200"]
```

Et préciser l'adresse IP de Elastic


