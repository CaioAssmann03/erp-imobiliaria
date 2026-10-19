#!/bin/sh
# ./deploy.sh          rebuild and restart with the code currently in ./app
# ./deploy.sh --pull   first update ./app (a real git clone) to origin/main
set -e
cd "$(dirname "$0")"

if [ "$1" = "--pull" ]; then
  git -C app fetch origin main
  git -C app reset --hard origin/main
fi

docker network inspect erp_edge >/dev/null 2>&1 || docker network create erp_edge
docker compose up -d --build
