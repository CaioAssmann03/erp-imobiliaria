---
summary: Local commands, environments, deploy flow, production security settings, production migrations, backups, runbook and rollback.
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
**System libraries (WeasyPrint renders the boleto PDF, spec 027):** the backend image installs `libpango-1.0-0`, `libpangoft2-1.0-0` and `fonts-liberation` (the `Dockerfile` and the CI job); running `manage.py` or pytest outside Docker needs them too (`brew install pango` on macOS, `apt install libpango-1.0-0 libpangoft2-1.0-0 fonts-liberation` on Debian/Ubuntu). Without them the PDF tests and `generate_billing_document_pdf` fail at import or render time.

URLs: API docs `localhost:8000/api/docs/` · schema `/api/schema/` · admin `/admin/` · frontend `localhost:3000`.

`docker compose up` fails with "port is already allocated" when another Postgres already uses 5432 (the Windows service, another project's container). Set `POSTGRES_HOST_PORT=5434` (any free port) in `.env`: it only changes the port on your computer; the containers still reach `db:5432`, so `POSTGRES_PORT` stays `5432`. `manage.py` and pytest run outside Docker then need `POSTGRES_PORT=5434` too. The tests never touch the data you see in the app: pytest creates its own database (`test_<POSTGRES_DB>`) and drops it when the session ends (a run with `--reuse-db` keeps it on purpose; the CI never does).

From `backend/` with the `db` up, **`POSTGRES_DB` must be exported for every `manage.py` outside Docker** (pytest has its own defaults):
```bash
export POSTGRES_DB=erp_imobiliaria POSTGRES_HOST=localhost
venv/bin/python manage.py check
venv/bin/python manage.py makemigrations --check --dry-run     # must be clean
venv/bin/python manage.py makemigrations <app>
```
After an API change: backend running → `cd frontend && pnpm generate:api` (it deletes and recreates `lib/api/generated/`, so **restart the frontend container afterwards**: the dev server keeps the empty folder in cache and answers 500), fix callers, `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, `pnpm build`. Reset (destroys data): `docker compose down -v && docker compose up -d`, migrate, create the superuser; if the backend starts before Postgres, `docker compose restart backend`. Dev tools: `pip install -r requirements-dev.txt`.

## Environments
| Env | How | Notes |
|---|---|---|
| Local | compose | backend `runserver`; Postgres on 5432 (host port `POSTGRES_HOST_PORT`) |
| CI | `.github/workflows/ci.yml`, Postgres + Redis services | `makemigrations --check`, `migrate`, `check`, `pytest apps` |
| Production | one VPS (Docker Compose), reached through the Caddy of a project that already runs there: see *Production on the VPS* | temporary name `erp.177-7-63-175.sslip.io` until the final domain exists. The old Render Blueprint was removed on 2026-10-19 |

## Deploy (backend)
Docker image → `entrypoint.sh`: `migrate --noinput` → `collectstatic --noinput` → optional `createsuperuser --noinput` (idempotent) → `gunicorn` (`WEB_CONCURRENCY`, default 2; `PORT`). Health check `GET /api/health/` (200 if the app runs and the database answers, 503 otherwise; no auth, answered before the HTTPS redirect and the host check). **Migrations run on every container start.** The environment of the production stack is described in *Production on the VPS*; `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` must match the real domain.

## Production on the VPS
Decided on 2026-10-08 (it replaces the Supabase, Vercel and Render plans of phase 3a part 01). One Ubuntu VPS runs the ERP **next to** another, unrelated project (`/root/air-app-node`) without sharing anything except the Caddy that owns ports 80/443.

| Piece | Where / how |
|---|---|
| Stack | `/root/erp-imobiliaria/docker-compose.yml`, Compose project `erp`: `db` (Postgres 16, volume `erp_postgres_data`), `redis`, `backend` (the `backend/Dockerfile` image: `entrypoint.sh` migrates, collects static, creates the admin, runs gunicorn), `celery_worker` and `celery_beat` (same image), `frontend` (the `production` stage of `frontend/Dockerfile`). Nothing but the frontend is reachable from outside; Postgres and Redis publish no port |
| HTTPS | the other project's Caddy (`/root/air-app-node/Caddyfile`) has a block for the ERP name that proxies to `frontend:3000`; it issues and renews the Let's Encrypt certificate. The ERP frontend joins the Docker network `erp_edge`, which that Caddy also joins (`docker network create erp_edge`; declared in both compose files) |
| Name | `erp.177-7-63-175.sslip.io` (sslip.io resolves any IP-in-the-name; free, real certificate). Swap it in the Caddyfile, `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` when the final domain exists, then raise `SECURE_HSTS_SECONDS` |
| Environment | `/root/erp-imobiliaria/.env` (mode 600, never in git): the variables of `architecture/overview.md`. Differences from local: `DEBUG=false`, `ALLOWED_HOSTS=<name>,backend,localhost` (`localhost` for the Admin tunnel), `SECURE_SSL_REDIRECT=false` (TLS ends at Caddy; the Next server calls Django over plain HTTP on the private network), `API_INTERNAL_URL=http://backend:8000`, generated `SECRET_KEY`, `JWT_SIGNING_KEY` (Ed25519, spec 022; changing it logs everybody out), `INTERNAL_API_KEY`, database password and first-admin password |
| Code | `/root/erp-imobiliaria/app` is a git clone of the repository (read-only *Deploy key* `erp_deploy`); `./deploy.sh --pull` resets it to `origin/main` and rebuilds. CI does not deploy (a push-to-deploy workflow was set aside on 2026-10-19) |
| Deploy | `cd /root/erp-imobiliaria && ./deploy.sh --pull` (creates `erp_edge` if missing, then `docker compose up -d --build`). Migrations run on container start |
| Versioned files | `docker-compose.yml`, `deploy.sh` and `deploy.env` are in [`deploy/vps/`](../../../deploy/vps/README.md) (copied from the VPS on 2026-10-19, plus the backend health check); after changing one, copy it to `/root/erp-imobiliaria/`. The `.env` and the deploy key stay only on the VPS; the Caddy block is in the other project's repository |

Receipts (spec 018) live in a private **Cloudflare R2** bucket, not on the VPS: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` and `AWS_S3_ENDPOINT_URL` in `.env` (without them the receipt endpoints answer 503). The bucket needs a CORS rule that allows `PUT` and `GET` from the ERP origin with the `Content-Type` header, otherwise the browser upload is blocked.

The address map (spec 021) is Google's **Maps Embed API** under the condominium address. `GOOGLE_MAPS_EMBED_KEY` goes in `.env` and in the environment of the `frontend` service (the Next server reads it on every request: a new key needs a restart of the frontend, not a rebuild); without it the form shows only an "Abrir no Maps" link. The key is public by design (it is in the page's HTML), so in the Google Cloud console restrict it to **Websites** (HTTP referrers: `http://localhost:3000/*` and the production origin) and to the **Maps Embed API** only, and put a budget alert on the billing account: the API has no per-request charge, but Google Cloud requires a billing account. A blank frame under the address means the key is wrong or not allowed for that origin; the link below it still works.

## Production security
| Variable | Default | Notes |
|---|---|---|
| `SECURE_SSL_REDIRECT` | on when `DEBUG=false` | plain HTTP is redirected to HTTPS (the health path is exempt) |
| `SECURE_HSTS_SECONDS` | `3600` when `DEBUG=false`, `0` in development | no `includeSubDomains`, no `preload`; raise to `31536000` only when the final domain exists |
| `ADMIN_URL` | `admin/` | set a non-obvious path in production (obscurity only); a check (`core.W001`) warns while it is the default; an empty, absolute (`://`) or `..` value stops startup |
| `INTERNAL_API_KEY` | none | mandatory when `DEBUG=false`; the same value on the backend and the Next server |

**Checklist for a new host** (checked on the VPS on 2026-10-08):
- [x] TLS is terminated in front: Caddy serves the browser over HTTPS and proxies to the Next server. Django is not reached by the browser at all; it listens only on the private Docker network.
- [x] The health path answers: `GET /api/health/` returned 200 from inside the stack (`docker compose exec backend`). The compose file (`deploy/vps/docker-compose.yml`) checks it every 15 s and the frontend waits for a healthy backend.
- [x] The frontend's `API_INTERNAL_URL` is plain `http://backend:8000` on the private network, so `SECURE_SSL_REDIRECT=false` there (with the redirect on, that URL would loop on 301).
- [x] `INTERNAL_API_KEY` and `SECRET_KEY` are set and `REDIS_URL` is reachable (the login rate limit lives there).
- [ ] `JWT_SIGNING_KEY` (spec 022) is set in the host `.env` **before** deploying the EdDSA change: without it the backend and Celery do not start. Every user logs in again after that deploy.
- [x] `ADMIN_URL` is set to a non-obvious path in the host `.env` (2026-10-19; the value is never written in git). The Admin is not published by Caddy and the Next proxy only forwards `/api/...` segments (`frontend/lib/api-path.ts`); it is opened through the SSH tunnel below.
- [ ] After every deploy, smoke test that the proxy cannot leave `/api`: `curl -s -o /dev/null -w '%{http_code}' --path-as-is https://<name>/api/..%2fadmin/login/` must print `404` (it printed `200`, the Django Admin login page, until the segment check was added).

### Django Admin through an SSH tunnel
The backend publishes port 8000 on the VPS **loopback only** (`127.0.0.1:8000`, `deploy/vps/docker-compose.yml`); nothing new is reachable from the internet. From your computer:
```bash
ssh -N -L 8000:127.0.0.1:8000 root@177.7.63.175   # keep it open while you use the Admin
```
Then open `http://localhost:8000/<ADMIN_URL>` (the path is in the host `.env`). It needs `localhost` in `ALLOWED_HOSTS`. The session and CSRF cookies are `Secure` in production: Chrome and Firefox accept them on `http://localhost`, Safari does not (use another browser). Close the tunnel with Ctrl+C.

## Migrations in production
1. Commit them with the feature; CI fails on missing ones.
2. Keep them **backward compatible** for one deploy (nullable/default first, remove later): old and new containers overlap.
3. Never edit an applied migration; data migrations are idempotent with a reverse.
4. **History reset:** migrations were reset to one `0001` per app before production. A database that applied the *old* ones must be recreated (or its `django_migrations` reconciled) first; confirm with the user before touching a shared DB.

## Seeding, logs, backups
`seed_demo` is local/demo only: **never in production** with real data (the initial company comes from `core.0002_seed_company`). Logs go to stdout; no structured logging, error tracker or alerts yet (use `logging.getLogger(__name__)`, log ids and outcomes, never personal data). No backup policy yet: a real deployment needs scheduled `pg_dump` (or the provider's plan), a tested restore and retention, which needs a spec before go-live. The ERP database on the VPS has **no** backup (the other project there has a daily dump in `/root/backups`; do not assume it covers the ERP volume), and the receipt files live in R2, outside any Postgres dump.

## Runbook
| Symptom | Cause → action |
|---|---|
| `Connection refused` to `db` at startup | backend started before Postgres → restart it |
| `relation "..." does not exist`, login 500 | migrations not applied → `migrate`, create the superuser |
| `makemigrations --check` fails in CI | model changed without migration → `makemigrations`, commit |
| `POSTGRES_DB is not set` | variable missing outside Docker → export it |
| the backend container restarts or the login fails after a model edit | read `docker logs <backend>`: a model that fails to import stops the whole app at startup |
| the frontend answers 500 "Export ... doesn't exist" after `generate:api` | restart the frontend container (stale module cache) |
| admin login fails behind HTTPS (CSRF) | host missing from `ALLOWED_HOSTS` |
| frontend cannot call the API | the browser only calls the Next server (same origin); check the Next server's `API_INTERNAL_URL` and `INTERNAL_API_KEY` |
| host keeps restarting the backend | its health check must call `/api/health/`; a 503 means the database does not answer (the log has the reason) |
| `https://<name>` answers 502 right after a deploy | the frontend is still starting or crashed: `docker compose logs frontend`; Caddy reaches it as `frontend:3000` on `erp_edge`, so check the network exists and both stacks joined it |
| the other project's site went down after editing its Caddyfile | restore `Caddyfile.bak-antes-erp` / `docker-compose.yml.bak-antes-erp` in `/root/air-app-node` and `docker compose up -d --no-deps caddy`; validate first with `caddy validate` in a throwaway container |
| every request redirects (301) forever | `X-Forwarded-Proto` is not reaching Django behind the proxy, or `API_INTERNAL_URL` is plain `http` |

**Rollback:** redeploy the previous image; undo a migration with `migrate <app> <previous>` (destructive schema changes are not reversible, hence rule 2).
