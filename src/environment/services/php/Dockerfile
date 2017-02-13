ARG PHP_VERSION
ARG PHP_EXTENSIONS
ARG PHP_XDEBUG

MAINTAINER zoltan.fodor@pitechnologies.ro

RUN apk upgrade --update

# Install any additional php extensions.
RUN for extension in ${PHP_EXTENSIONS}; do \
        # GD library dependencies
        if [ extension == "gd" ]; then \
            apk add \
                coreutils \
                freetype-dev \
                libjpeg-turbo-dev \
                libltdl \
                libmcrypt-dev \
                libpng-dev \
        fi; \
        docker-php-ext-install -j$(nproc) $extension \
    done;

# If so install xdebug and configure it.
RUN ${PHP_XDEBUG} && \
    docker-php-ext-install -j$(nproc) dev && \
    pecl install xdebug && \
    docker-php-ext-enable xdebug
