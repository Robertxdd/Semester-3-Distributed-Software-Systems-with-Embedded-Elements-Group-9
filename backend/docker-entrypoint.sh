#!/bin/sh
set -eu

wait_for_mysql() {
  host="${DB_HOST:-db}"
  port="${DB_PORT:-3306}"
  db="${DB_DATABASE:-desk}"
  user="${DB_USERNAME:-root}"
  pass="${DB_PASSWORD:-root}"

  echo "Waiting for MySQL at ${host}:${port}..."
  i=0
  while true; do
    if php -r "
      try {
        new PDO(
          'mysql:host=${host};port=${port};dbname=${db}',
          '${user}',
          '${pass}',
          [PDO::ATTR_TIMEOUT => 1]
        );
        exit(0);
      } catch (Throwable \$e) {
        exit(1);
      }
    "; then
      echo "MySQL is reachable."
      return 0
    fi
    i=$((i+1))
    if [ $((i % 10)) -eq 0 ]; then
      echo "Still waiting for MySQL..."
    fi
    sleep 1
  done
}

wait_for_mysql

echo "Running migrations..."
php artisan migrate --force || true

echo "Seeding database..."
php artisan db:seed --force || true

echo "Starting Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
