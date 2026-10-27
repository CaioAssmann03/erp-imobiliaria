# Nightly database backup (spec 040)

A small container that dumps the ERP database every night, encrypts it and uploads it to a private bucket off the
server. The job is `backup.py`; the runbook (enable, check, restore drill, disaster restore) is in
[`backend/docs/architecture/operations.md`](../backend/docs/architecture/operations.md) → *Database backup*.

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

Copy this folder next to that compose file (`scp -r backup root@<vps>:/root/erp-imobiliaria/`).
The tests (stdlib `unittest`; the dump round trip needs a reachable PostgreSQL and is skipped without one):

```bash
python -m unittest discover -s backup/tests -v
```
