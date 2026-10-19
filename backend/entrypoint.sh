#!/bin/sh
# Inicialização do backend em produção (VPS). Em desenvolvimento o docker-compose
# sobrescreve o comando (runserver), então este script não roda lá.
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Cria o administrador na 1ª subida, se as variáveis estiverem definidas (idempotente).
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py createsuperuser --noinput || true
fi

# Produção pode definir PORT; sem ela, 8000.
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers "${WEB_CONCURRENCY:-2}"
