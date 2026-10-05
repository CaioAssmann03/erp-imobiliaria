---
summary: Environments, deploy flow, migrations in production, backups, logs, runbook, rollback.
read-when: you deploy, migrate production or troubleshoot an environment
skip-if: local commands → architecture/operations/local-dev.md; stack overview → architecture/foundation/overview.md
---
# Operations (environments, deploy, runbook)

## Environments
| Env | How | Notes |
|---|---|---|
| Local | `docker compose up -d` (db, redis, backend `runserver`, celery worker/beat, frontend) | `.env` from `.env.example`; Postgres on 5432 |
| CI | `.github/workflows/ci.yml`: Postgres + Redis services | `makemigrations --check`, `migrate`, `check`, `pytest apps` (installs `requirements-dev.txt`) |
| Production | Render Blueprint `render.yaml`: Postgres, Redis, backend (Docker), frontend (Docker) | free plan: services sleep, Postgres expires after 30 days, no Celery workers |

## Deploy flow (backend)
Docker image → `backend/entrypoint.sh`: `migrate --noinput` → `collectstatic --noinput` → optional `createsuperuser --noinput` (needs
`DJANGO_SUPERUSER_USERNAME` and `DJANGO_SUPERUSER_PASSWORD`; idempotent) → `gunicorn` (`WEB_CONCURRENCY`, default 2 workers, `PORT`). Health check path
`/api/schema/`. **Migrations run on every container start.**

Environment variables per service are in `render.yaml` (shared group `erp-imobiliaria-shared`); `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` must match the
real Render domains; Santander/Resend variables are placeholders until those features exist.

## Migrations in production
1. Generate and commit with the feature; CI fails on missing migrations.
2. Make them **backward compatible** for one deploy (add nullable column/default first, remove later) because old and new containers can overlap.
3. Never edit an applied migration. Data migrations are idempotent with a reverse.
4. **History reset warning:** the project reset its migrations to one `0001` per app before production use. A database that already applied the *old*
   migrations must be recreated (or its `django_migrations` rows reconciled) before deploying this history. Confirm with the user before touching a shared DB.

## Seeding
- `seed_demo` is for local/demo data (`--clear` to remove). **Do not run it in production** with real data present.
- The initial company (EVE) is created by migration `core.0002_seed_company`.

## Observability (today)
Logs go to stdout (`docker compose logs backend`, Render logs). No structured logging, error tracker, metrics or alerts yet (known-gaps.md). When adding
logging: use `logging.getLogger(__name__)`, log ids and outcomes, never personal data ([security.md](../quality/security.md)).

## Backups
No automated backup policy is defined in the repo. Render free Postgres expires; a real deployment needs scheduled `pg_dump` (or the provider's backup
plan), a tested restore, and a retention rule. Needs a spec before go-live.

## Runbook
| Symptom | Likely cause | Action |
|---|---|---|
| `Connection refused` to `db` at startup | backend started before Postgres was ready | restart the backend service/container (add a DB health check + `depends_on: service_healthy`) |
| `relation "..." does not exist` | migrations not applied | `docker compose exec backend python manage.py migrate` |
| login returns 500 | tables missing (see above) or `accounts_user` absent | migrate; create the superuser |
| `makemigrations --check` fails in CI | model changed without migration | `makemigrations`, commit |
| `POSTGRES_DB is not set` when running a command | the variable is missing outside Docker | export `POSTGRES_DB`/`POSTGRES_HOST` (`architecture/operations/local-dev.md`) |
| admin login fails behind HTTPS (CSRF) | host missing from `ALLOWED_HOSTS` | fix the env var |
| frontend cannot call the API (CORS) | `CORS_ALLOWED_ORIGINS` mismatch | set the exact frontend origin |

## Rollback
Redeploy the previous image. If a migration must be undone: `python manage.py migrate <app> <previous_migration>` (reverses exist for data migrations);
destructive schema changes are not reversible, hence rule 2 above.

## Celery
`celery_worker` and `celery_beat` run locally; on Render they are commented out (paid plan). Redis is provisioned. No task exists yet (`architecture/structure/extending.md`).
