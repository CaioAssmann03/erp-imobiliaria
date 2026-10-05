---
summary: Local commands, environments, deploy flow, production migrations, seeding, backups, runbook and rollback.
read-when: you need a command to work locally, deploy, migrate production or troubleshoot an environment
skip-if: stack, env vars, request flow → architecture/overview.md; tests → architecture/quality.md
---
# Operations

## Local
```bash
cp .env.example .env                                           # first time (repo root)
docker compose up -d                                           # db, redis, backend, celery worker/beat, frontend
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser   # or DJANGO_SUPERUSER_* + --noinput
docker compose exec backend python manage.py seed_demo         # demo data (--clear removes it)
```
URLs: API docs `localhost:8000/api/docs/` · schema `/api/schema/` · admin `/admin/` · frontend `localhost:3000`.

From `backend/` with the `db` up, **`POSTGRES_DB` must be exported for every `manage.py` outside Docker** (pytest has its own defaults):
```bash
export POSTGRES_DB=erp_imobiliaria POSTGRES_HOST=localhost
venv/bin/python manage.py check
venv/bin/python manage.py makemigrations --check --dry-run     # must be clean
venv/bin/python manage.py makemigrations <app>
```
After an API change: backend running → `cd frontend && npm run generate:api`, fix callers, `npx tsc --noEmit`, `npx eslint .`, `npm run build`.
Reset (destroys data): `docker compose down -v && docker compose up -d`, migrate, create the superuser; if the backend starts before Postgres, `docker compose restart backend`.
Dev tools: `pip install -r requirements-dev.txt` (Python 3.12).

## Environments
| Env | How | Notes |
|---|---|---|
| Local | compose (above) | backend `runserver`; Postgres on 5432 |
| CI | `.github/workflows/ci.yml`, Postgres + Redis services | `makemigrations --check`, `migrate`, `check`, `pytest apps` |
| Production | Render Blueprint `render.yaml`: Postgres, Redis, backend and frontend (Docker) | free plan: services sleep, Postgres expires after 30 days, no Celery workers (worker/beat are commented out) |

## Deploy (backend)
Docker image → `entrypoint.sh`: `migrate --noinput` → `collectstatic --noinput` → optional `createsuperuser --noinput` (idempotent) → `gunicorn` (`WEB_CONCURRENCY`, default 2; `PORT`).
Health check `GET /api/health/` (200 if the app runs and the database answers, 503 otherwise; no auth, answered before the HTTPS redirect and the host check). **Migrations run on every container start.** Per-service env vars are in `render.yaml` (group `erp-imobiliaria-shared`);
`ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` must match the real Render domains.

## Production security (spec 008)
| Variable | Default | Notes |
|---|---|---|
| `SECURE_SSL_REDIRECT` | on when `DEBUG=false` | plain HTTP is redirected to HTTPS (the health path is exempt by construction) |
| `SECURE_HSTS_SECONDS` | `3600` when `DEBUG=false`, `0` in development | no `includeSubDomains`, no `preload`; raise to `31536000` only when the final domain exists |
| `ADMIN_URL` | `admin/` | in production set a non-obvious path (obscurity only); a check (`core.W001`) warns while it is the default; a value that is empty, absolute (`://`) or contains `..` stops startup |
| `INTERNAL_API_KEY` | none | mandatory when `DEBUG=false`; the same value on the backend and the Next server |

**Checklist for a new host** (spec 008, R8; tick it on the real environment):
- [ ] The platform terminates TLS and sends `X-Forwarded-Proto: https` (Django trusts it: `SECURE_PROXY_SSL_HEADER`).
- [ ] The platform's health check calls `GET /api/health/` over HTTP (any `Host`).
- [ ] The frontend's `API_INTERNAL_URL` is `https` (or the platform's private network sends `X-Forwarded-Proto: https`); with the redirect on, a plain `http` URL would be redirected and break the Next server's calls.
- [ ] `ADMIN_URL`, `INTERNAL_API_KEY`, `SECRET_KEY` are set; `REDIS_URL` is reachable (the login rate limit lives there).

## Migrations in production
1. Commit them with the feature; CI fails on missing ones.
2. Keep them **backward compatible** for one deploy (nullable/default first, remove later): old and new containers overlap.
3. Never edit an applied migration; data migrations are idempotent with a reverse.
4. **History reset:** migrations were reset to one `0001` per app before production. A database that applied the *old* ones must be recreated (or its `django_migrations` reconciled) first; confirm with the user before touching a shared DB.

## Seeding, logs, backups
- `seed_demo` is local/demo only; **never in production** with real data. The initial company (EVE) comes from migration `core.0002_seed_company`.
- Logs go to stdout (Render logs). No structured logging, error tracker or alerts yet; when adding logs use `logging.getLogger(__name__)`, log ids and outcomes, never personal data.
- No backup policy yet: a real deployment needs scheduled `pg_dump` (or the provider's plan), a tested restore and retention. Needs a spec before go-live.

## Runbook
| Symptom | Cause → action |
|---|---|
| `Connection refused` to `db` at startup | backend started before Postgres → restart it |
| `relation "..." does not exist`, login 500 | migrations not applied → `migrate`, create the superuser |
| `makemigrations --check` fails in CI | model changed without migration → `makemigrations`, commit |
| `POSTGRES_DB is not set` | variable missing outside Docker → export it |
| admin login fails behind HTTPS (CSRF) | host missing from `ALLOWED_HOSTS` |
| frontend cannot call the API (CORS) | the browser only calls the Next server (same origin); check the Next server's `API_INTERNAL_URL` and `INTERNAL_API_KEY` |
| host keeps restarting the backend | its health check must call `/api/health/`; a 503 there means the database does not answer (the log has the reason) |
| every request redirects (301) forever | `X-Forwarded-Proto` is not reaching Django behind the proxy, or the Next server's `API_INTERNAL_URL` is plain `http` |

**Rollback:** redeploy the previous image; undo a migration with `migrate <app> <previous>` (destructive schema changes are not reversible, hence rule 2).
**Celery:** no task exists yet; recipe in `architecture/structure.md`.
