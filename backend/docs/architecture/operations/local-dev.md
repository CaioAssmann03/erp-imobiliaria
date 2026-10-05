---
summary: Cheat sheet: run, migrate, seed, test, regenerate the client, reset the database locally.
read-when: you need a command to work locally
skip-if: production deploy or runbook → architecture/operations/operations.md
---
# Local development cheat sheet

```bash
cp .env.example .env                       # first time (repo root)
docker compose up -d                       # db, redis, backend, celery, frontend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser   # or DJANGO_SUPERUSER_* env + --noinput
docker compose exec backend python manage.py seed_demo         # demo data (--clear removes it)
```
URLs: API docs `http://localhost:8000/api/docs/` · schema `/api/schema/` · admin `/admin/` · frontend `http://localhost:3000`.

## Daily commands (from `backend/`, with the compose `db` running)
`POSTGRES_DB` must be set for **every** `manage.py`/`pytest` command run outside Docker (settings refuse to load without it).

```bash
export POSTGRES_DB=erp_imobiliaria POSTGRES_HOST=localhost
venv/bin/python manage.py check
venv/bin/python manage.py makemigrations --check --dry-run     # must be clean
venv/bin/python manage.py makemigrations <app>
venv/bin/python -m pytest apps -q                              # needs PostgreSQL
docker compose logs -f backend
```
Or run commands inside the container: `docker compose exec backend python manage.py <cmd>`.

## After changing the API
Backend running → in `frontend/`: `npm run generate:api`, then fix callers and run `npx tsc --noEmit`, `npx eslint .`, `npm run build`.

## Reset the database (destroys data)
`docker compose down -v && docker compose up -d` then migrate and create the superuser again. If the backend starts before Postgres is ready, restart it
(`docker compose restart backend`).

## Python environment
Runtime is Python 3.12 (Docker/CI); install dev tools with `pip install -r requirements-dev.txt` (pytest, mypy and stubs).
