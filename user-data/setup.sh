#!/bin/bash
APPDIR='/var/www/html'

# update repo
yum update -y

# install necessary package
yum install git -y

# install nginx
amazon-linux-extras install nginx1.12

# check directory app
if [ ! -d $APPDIR ]; then
  mkdir $APPDIR
fi

# clone app
git clone https://github.com/Hextris/hextris.git $APPDIR

# enable web server
systemctl enable nginx
systemctl start nginx