---
summary: Spec 040 — the nightly encrypted PostgreSQL backup of the VPS, kept off the server in a private bucket, with retention and a documented restore.
read-when: you build or change the database backup, its schedule, retention, encryption or the restore drill
skip-if: deploy and runbook → architecture/operations.md; the receipts bucket → apps/finance.md; the list of known gaps → known-gaps.md
---
# 040 — Database backup

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** deploy (no Django app) · **Frontend impact:** none

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-27 | The backup comes **before real data** enters the production database (gap #19), and Asaas is postponed | the user |
| 2026-10-27 | Copies live **off the VPS, in a Cloudflare R2 bucket** (the same service that holds the receipts), never only on the server's disk | the user |
| 2026-10-27 | **Daily**, keeping the **last 30 days plus the first backup of each of the last 12 months** | the user |
| 2026-10-27 | Copies are **encrypted before they leave the VPS** (they hold personal data); the restore must work with standard tools (`openssl` and `pg_restore`), without this project's code | agent, to be confirmed |
| 2026-10-27 | A **separate bucket and keys** from the receipts' (a leaked receipts key must not reach the backups, and the other way round) | agent, to be confirmed |

## R — Requirements
Losing the VPS, its disk or the database by mistake must cost at most one day of work, and real data may enter only once this exists.
- [x] R1 — A container of the production stack runs a **full dump** of the ERP database every night at a fixed local time and uploads it to the backup bucket
- [x] R2 — The file is **encrypted** with a passphrase kept only in the VPS `.env` (and by the user): `aes-256-cbc`, PBKDF2, salted; the bucket never holds a readable dump
- [x] R3 — **Retention:** the last 30 days are kept, plus the earliest backup of each of the last 12 months; everything older is deleted after a successful upload (never before)
- [x] R4 — A failed dump or upload exits non-zero with a clear log line and **deletes nothing**; the next night tries again
- [x] R5 — `backup.py status` lists the backups with their age and size and **exits non-zero when the newest is older than 26 hours** (so a monitor or the user can check at a glance)
- [x] R6 — **Restore** works with `openssl` + `pg_restore` alone (documented), and `backup.py restore` does the same into a database the user names; the restore was **proven here** by dumping, encrypting, decrypting and restoring a real PostgreSQL database and comparing the rows
- [x] R7 — No secret is in git: the keys and the passphrase come from the VPS `.env`; `.env.example` has placeholders

## E — Entities
None (no table, no migration).

## A — Approach
- A `backup` service in `deploy/vps/docker-compose.yml`, built from `postgres:16` (the same major version as the `db` container, so `pg_dump` always matches) plus Python 3 and `boto3`. It sleeps until the daily time, runs the job, and repeats; `restart: unless-stopped` brings it back after a reboot.
- The job: `pg_dump -Fc` (custom format, already compressed) piped into `openssl enc`, to a temporary file, then uploaded with `boto3` to `s3://<bucket>/db/erp-YYYYMMDD-HHMMSS.dump.enc`; then the retention prune.
- The decisions are pure functions (`select_backups_to_delete`, `is_stale`) with unit tests; the subprocess and S3 parts are thin and injectable.
- Rejected: a Celery task in the backend (the backend image has no `pg_dump` of the right version and a backup that depends on the app being healthy is a weaker backup); a provider snapshot (the VPS plan is not known to offer one); the `db` container's volume copied by hand (not consistent while running).

## S — Structure
- `deploy/vps/backup/Dockerfile`, `backup.py`, `tests/test_backup.py` (stdlib `unittest`, run in CI)
- `deploy/vps/docker-compose.yml` (the `backup` service), `deploy/vps/README.md`, `.env.example` (`BACKUP_*`)
- `backend/docs/architecture/operations.md` (backup and restore runbook), `known-gaps.md` (#19), `.github/workflows/ci.yml` (one step)

## O — Operations
1. The user creates a **private R2 bucket** for the backups and an API token limited to it, and a long random passphrase kept in a password manager **and** in the VPS `.env`.
2. Copy `docker-compose.yml` and `backup/` to the VPS, add the `BACKUP_*` variables to the `.env`, `./deploy.sh`.
3. Run `docker compose exec backup python backup.py run-once` and then `python backup.py status`.
4. Do **one restore drill** into a scratch database and check the row counts (see the runbook) before trusting it.

## N — Norms
`architecture/operations.md` for the runbook. English in code and docs.

## S — Safeguards
- **Personal data:** the dump holds people's documents and addresses: it leaves the VPS only encrypted, and the passphrase never leaves the `.env` (lose it and the backups are unreadable: keep a copy outside the VPS).
- **Retention never runs after a failure**, so a broken upload cannot shrink the history.
- The bucket keys are write/list/delete on the backup bucket only; the receipts bucket and its keys are untouched.
- The container mounts nothing from the host and reaches the database over the Compose network.
- Not covered: the receipt files (they live in R2, outside any Postgres dump) and a point-in-time restore between two nights.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2, R6 | `deploy/vps/backup/tests/test_backup.py::DumpAndRestoreTest` (a real `pg_dump`, `openssl` and `pg_restore` round trip on a scratch PostgreSQL database; skipped when no server is reachable) |
| R3 | `deploy/vps/backup/tests/test_backup.py::RetentionTest` |
| R4 | `deploy/vps/backup/tests/test_backup.py::FailureTest` (nothing is deleted when the dump or the upload fails) |
| R5 | `deploy/vps/backup/tests/test_backup.py::StatusTest` |
| R7 | review: no secret in git; `.env.example` has placeholders |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean: `N/A — no Django change`
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated: `N/A — no API change`
- [x] `docs/architecture/operations.md` updated; `docs/known-gaps.md` row updated
- [x] Roadmap part and phase table: `N/A — Roadmap: none`; index in `features/README.md` updated

## Pending before `done`
Enable it on the VPS (the bucket, the keys, the passphrase), run `run-once`, and do the first restore drill into a scratch database. Until then gap #19 stays open: **real data must not enter the production database yet.**
