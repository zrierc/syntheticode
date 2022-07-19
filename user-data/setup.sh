#!/bin/bash
APPDIR='/usr/share/nginx/html'

# update repo
yum update -y

# install necessary package / dependency
amazon-linux-extras install nginx1.12
amazon-linux-extras enable php8.0
yum clean metadata
yum install php php-cli php-mysqlnd php-pdo php-common php-fpm git -y

# check public nginx directory
if [ -d $APPDIR ]; then
  rm -rf APPDIR/*
else
  mkdir $APPDIR
fi

# dummy app to check if load balancer and auto scaling works
echo "<?php echo 'Local IP Address : '.getHostByName(getHostName()); phpinfo(); ?> " > $APPDIR/index.php

# start web server
systemctl start nginx
systemctl start php-fpm

systmectl enable nginx
systemctl enable php-fpm