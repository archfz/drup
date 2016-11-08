FROM httpd:latest

MAINTAINER _Archy_ <fodor18zoltan@gmail.com>

RUN apt-get update && \
    apt-get install wget -y && \
    printf "deb http://packages.dotdeb.org jessie all\n\
          deb-src http://packages.dotdeb.org jessie all" >> \
          /etc/apt/sources.list

RUN wget https://www.dotdeb.org/dotdeb.gpg && \
    apt-key add dotdeb.gpg && \
    rm dotdeb.gpg && \
    apt-get update

RUN apt-get install -y \
    #PHP
    php7.0 \
    php7.0-common \
    libapache2-mod-php7.0
