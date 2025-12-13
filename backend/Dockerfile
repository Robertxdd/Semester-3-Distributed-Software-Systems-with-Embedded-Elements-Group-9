FROM php:8.2-cli

RUN apt-get update && apt-get install -y \
    git unzip libzip-dev libpq-dev \
 && docker-php-ext-install pdo pdo_mysql zip

WORKDIR /app

COPY . .

RUN cp .env.example .env || true
RUN php artisan key:generate || true

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
