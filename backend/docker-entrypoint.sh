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
  while [ "$i" -lt 30 ]; do
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
    sleep 1
  done

  echo "MySQL not reachable after 30s. Continuing anyway."
  return 1
}

wait_for_mysql || true

echo "Running migrations..."
php artisan migrate --force || true

echo "Seeding database..."
php artisan db:seed --force || true

echo "Starting Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
