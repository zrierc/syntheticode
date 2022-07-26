#!/bin/bash
DATADIR="/sampleData"
MYSQL_DEFAULT_PASWORD=$(grep 'temporary password' /var/log/mysqld.log | awk '{print $NF}')
MYSQL_PASSWORD="admin123"

# update repo
yum update -y

# install necessary package
yum install git -y
yum install https://dev.mysql.com/get/mysql80-community-release-el7-5.noarch.rpm -y

amazon-linux-extras install epel -y
yum install mysql-community-server -y

# check directoryy for data
if [ -d "${DATADIR}" ]; then
  rm -rf DATADIR/*
else
  mkdir -p "${DATADIR}"
fi

# clone sample db
git clone https://github.com/aws-samples/aws-database-migration-samples.git "$DATADIR"

# Start DB
systemctl start mysqld
systemctl enable mysqld

# Configure DB
mysql -uroot -p"${MYSQL_DEFAULT_PASWORD}" -e "GRANT ALL ON *.* TO root@'%' IDENTIFIED BY '$MYSQL_PASSWORD'; FLUSH PRIVILEGES;";

systemctl restart mysqld