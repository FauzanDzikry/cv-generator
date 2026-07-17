# Stage 1: PHP Dependencies
FROM composer:2.6 AS vendor
WORKDIR /app
# Copy composer files for optimal caching
COPY composer.json composer.lock ./
# Run install, ignore platform reqs to prevent extension errors during build
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --ignore-platform-reqs --no-scripts

# Stage 2: Frontend Assets (React + Inertia)
FROM node:20-alpine AS frontend
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 3: Production Image
FROM php:8.2-fpm-alpine

# Install system dependencies, Nginx, Supervisord, and PostgreSQL driver
RUN apk add --no-cache \
    nginx \
    supervisor \
    postgresql-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql gd zip bcmath

WORKDIR /var/www/html

# Copy application code
COPY --chown=www-data:www-data . .

# Copy vendor & build assets from previous stages
COPY --chown=www-data:www-data --from=vendor /app/vendor/ vendor/
COPY --chown=www-data:www-data --from=frontend /app/public/build/ public/build/

# Setup permissions
RUN chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Configure Nginx for Laravel
RUN { \
    echo 'server {'; \
    echo '    listen 80;'; \
    echo '    server_name _;'; \
    echo '    root /var/www/html/public;'; \
    echo '    index index.php index.html;'; \
    echo '    location / {'; \
    echo '        try_files $uri $uri/ /index.php?$query_string;'; \
    echo '    }'; \
    echo '    location ~ \.php$ {'; \
    echo '        include fastcgi_params;'; \
    echo '        fastcgi_pass 127.0.0.1:9000;'; \
    echo '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;'; \
    echo '        fastcgi_index index.php;'; \
    echo '    }'; \
    echo '}'; \
} > /etc/nginx/http.d/default.conf

# Configure Supervisord to run PHP-FPM and Nginx in one container
RUN { \
    echo '[supervisord]'; \
    echo 'nodaemon=true'; \
    echo '[program:php-fpm]'; \
    echo 'command=php-fpm -F'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
    echo '[program:nginx]'; \
    echo 'command=nginx -g "daemon off;"'; \
    echo 'stdout_logfile=/dev/stdout'; \
    echo 'stdout_logfile_maxbytes=0'; \
    echo 'stderr_logfile=/dev/stderr'; \
    echo 'stderr_logfile_maxbytes=0'; \
} > /etc/supervisord.conf

EXPOSE 80

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
