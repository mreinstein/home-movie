#!/bin/bash

# install node/npm
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# port forward port 80 to local port 8000
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000

sudo apt-get install -y nodejs build-essential iptables-persistent

sudo apt-get update

sudo apt-get upgrade


npm install

mkdir ~/media

# configure the voice interaction agent to run automatically at boot, restart on failure
sudo cp home-video.service /lib/systemd/system/

sudo systemctl daemon-reload

sudo systemctl enable home-video.service

sudo systemctl start home-video.service
