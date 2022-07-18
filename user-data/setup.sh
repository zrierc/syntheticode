#!/bin/bash
APPDIR='/usr/share/nginx/html'

# update repo
yum update -y

# install necessary package
yum install git -y

# install nginx
amazon-linux-extras install nginx1.12

# check directory app
if [ -d $APPDIR ]; then
  rm -rf APPDIR/*
else
  mkdir $APPDIR
fi
# clone app
git clone https://github.com/Hextris/hextris.git $APPDIR

# start web server
systemctl enable nginx
systemctl start nginx