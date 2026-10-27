# Production on the VPS

The files the VPS runs from `/root/erp-imobiliaria/`, outside the repository clone (`/root/erp-imobiliaria/app`).
How production works, its variables and the runbook: [`backend/docs/architecture/operations.md`](../../backend/docs/architecture/operations.md) → *Production on the VPS*.

| File | Purpose |
|---|---|
| `docker-compose.yml` | the production stack (Compose project `erp`): db, the nightly `backup`, redis, backend (with a health check, published on the VPS loopback for the Admin SSH tunnel), Celery worker and beat, frontend |
| `backup/` | the nightly encrypted database backup (the `backup` service: `Dockerfile`, `backup.py`, tests); copy the folder next to the compose file |
| `deploy.sh` | `./deploy.sh` rebuilds and restarts with the code in `./app`; `./deploy.sh --pull` first resets `./app` to `origin/main` |
| `deploy.env` | where `--pull` clones from (repository, branch, deploy key path); no secret |

The `.env` with the secrets and the deploy key `erp_deploy` stay only on the VPS. After changing a file here, copy it to the VPS:

```bash
scp deploy/vps/docker-compose.yml deploy/vps/deploy.sh root@<vps>:/root/erp-imobiliaria/
scp -r deploy/vps/backup root@<vps>:/root/erp-imobiliaria/
```
