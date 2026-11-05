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
# gthread: cada worker atende vários pedidos ao mesmo tempo (workers x threads). Cada thread usa uma conexão com o banco.
# max-requests recicla o worker de tempos em tempos (a memória não cresce com os dias); /dev/shm evita o falso "worker travado" em Docker.
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-3}" \
  --worker-class gthread \
  --threads "${GUNICORN_THREADS:-4}" \
  --timeout "${GUNICORN_TIMEOUT:-30}" \
  --graceful-timeout 30 \
  --max-requests 1000 \
  --max-requests-jitter 100 \
  --worker-tmp-dir /dev/shm
