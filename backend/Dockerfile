FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpq-dev curl \
 && docker-php-ext-install pdo pdo_mysql zip

WORKDIR /app

# Install Composer (inside the image) so we can install Laravel dependencies.
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install dependencies first (better Docker layer caching).
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts

# Copy the rest of the application.
COPY . .

RUN composer dump-autoload --optimize --no-interaction \
 && php artisan package:discover --ansi

# Ensure a minimal .env exists in the image so Laravel can boot (APP_KEY is required).
RUN if [ ! -f .env ]; then \
      printf "%s\n" \
        "APP_NAME=SmartDeskSupervisor" \
        "APP_ENV=local" \
        "APP_KEY=" \
        "APP_DEBUG=true" \
        "APP_URL=http://localhost:8000" \
        "LOG_CHANNEL=stderr" \
        "DB_CONNECTION=mysql" \
        "DB_HOST=db" \
        "DB_PORT=3306" \
        "DB_DATABASE=desk" \
        "DB_USERNAME=root" \
        "DB_PASSWORD=root" \
      > .env; \
    fi

RUN php artisan key:generate --force || true

EXPOSE 8000

RUN chmod +x /app/docker-entrypoint.sh
CMD ["/app/docker-entrypoint.sh"]
