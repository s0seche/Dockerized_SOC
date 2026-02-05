#!/bin/bash

# Vérification des droits root
if [ "$EUID" -ne 0 ]; then
  echo " Ce script doit être lancé en root."
   exit 1
fi

echo " Script lancé en root, démarrage de l'installation..."

apt install -y curl gnupg apt-transport-https # prérequis

curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch \
| gpg --dearmor -o /usr/share/keyrings/elastic.gpg # clé GPG 

echo "deb [signed-by=/usr/share/keyrings/elastic.gpg] https://artifacts.elastic.co/packages/7.x/apt stable main" \
| tee /etc/apt/sources.list.d/elastic-7.x.list # Dépôt

apt update && apt install -y filebeat

filebeat version

echo "Filebeat est installé"
echo
sleep 3
clear
echo " Modifier le fichier filebeat.yml et renseigner l'IP de Elastic :"
echo '
output.elasticsearch:
  hosts: ["IP:9200"]
'
echo "Puis écraser la config -> /etc/filebeat/filebeat.yml"

