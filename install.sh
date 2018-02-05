#!/bin/bash

# port forward port 80 to local port 8000
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8000
sudo apt-get install iptables-persistent


# set up unattended-upgrades
sudo apt-get install unattended-upgrades -y

sudo sed -i 's/^\/\/      "o=Raspbian,n=jessie"/      "o=Raspbian,n=jessie"/g' /etc/apt/apt.conf.d/50unattended-upgrades

# allow automatic reboots as required
sudo sed -i 's/^\/\/Unattended-Upgrade::Automatic-Reboot "false";/Unattended-Upgrade::Automatic-Reboot "true";/g' /etc/apt/apt.conf.d/50unattended-upgrades
sudo sed -i 's/^\/\/Unattended-Upgrade::Automatic-Reboot-Time "02:00";/Unattended-Upgrade::Automatic-Reboot-Time "02:00";/g' /etc/apt/apt.conf.d/50unattended-upgrades

# allow removing unused packages
sudo sed -i 's/^\/\/Unattended-Upgrade::Remove-Unused-Dependencies "false";/Unattended-Upgrade::Remove-Unused-Dependencies "true";/g' /etc/apt/apt.conf.d/50unattended-upgrades

# You could also create this file by running "dpkg-reconfigure -plow unattended-upgrades"
sudo tee /etc/apt/apt.conf.d/20auto-upgrades > /dev/null <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
