#!/bin/bash
DATADIR="/dms-sample"
MYSQL_DEFAULT_PASSWORD=$(grep 'temporary password' /var/log/mysqld.log | awk '{print $NF}')
MYSQL_NEW_PASSWORD="C0b4-Database"
LOCAL_IP=$(dig "$(hostname)" +short)

echo "${LOCAL_HOST_IP}"

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
git clone https://github.com/datacharmer/test_db.git "${DATADIR}/data/"

# Start DB
systemctl start mysqld
systemctl enable mysqld

# Make DB accessible through VPC
echo "bind-address=${LOCAL_IP}" >> /etc/my.cnf

# Import DB
mysql -uroot -p"${MYSQL_DEFAULT_PASSWORD}" < "${DATADIR}/data/employees.sql";

# Grant premission & change default passowrd

# * CREATE USER 'dms'@'%' IDENTIFIED BY 'password';
# * GRANT ALL PRIVILEGES ON *.* TO 'dms'@'%' WITH GRANT OPTION;

# ! mysql -uroot -p"${MYSQL_DEFAULT_PASSWORD}" -e "GRANT ALL ON *.* TO root@'%' IDENTIFIED BY '${MYSQL_NEW_PASSWORD}'; FLUSH PRIVILEGES;";

systemctl restart mysqld