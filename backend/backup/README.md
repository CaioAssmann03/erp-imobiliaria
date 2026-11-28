# Nightly database backup (spec 040)

A small container that dumps the ERP database every night, encrypts it and uploads it to a private bucket off the
server. The job is `backup.py`; the runbook (enable, check, restore drill, disaster restore) is in
[`docs/architecture/operations.md`](../docs/architecture/operations.md) → *Database backup*.

Add it to the production Compose project next to `db` (the repository does not version the production compose):

```yaml
  backup:
    build: ./backup
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_HOST: db
      TZ: America/Sao_Paulo
    depends_on:
      db:
        condition: service_healthy
```

Copy this folder next to that compose file (`scp -r backend/backup root@<vps>:/root/erp-imobiliaria/`).
The tests are stdlib `unittest`; the dump round trip needs a reachable PostgreSQL and is skipped without one. Run them
in the backup image, as CI does: `pg_dump` and `pg_restore` must be the same major as the server (PostgreSQL 16), because
a 17+ client writes `SET transaction_timeout`, which a 16 server refuses (the round trip then fails with
`Command was: SET transaction_timeout = 0;`).

```bash
docker build --tag erp-backup backend/backup
docker run --rm --network host -e PYTHONDONTWRITEBYTECODE=1 -e POSTGRES_HOST=localhost -e POSTGRES_PASSWORD=postgres \
  --volume "$PWD/backend/backup:/backup" erp-backup python3 -m unittest discover -s tests -v
```

`--network host` reaches a PostgreSQL published on port 5432 of the machine; on Docker Desktop use
`-e POSTGRES_HOST=host.docker.internal` instead. With a PostgreSQL 16 client installed you can also run
`cd backend && python -m unittest discover -s backup/tests -v`.
