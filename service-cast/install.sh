#!/bin/bash

# install node/npm
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

sudo apt-get install -y nodejs build-essential

sudo apt-get update

sudo apt-get upgrade


npm install

# configure the casting service to run automatically at boot, restart on failure
sudo cp home-cast.service /lib/systemd/system/

sudo systemctl daemon-reload

sudo systemctl enable home-cast.service

sudo systemctl start home-cast.service
