---
summary: How tests are organized and run (PostgreSQL required), what to test per layer, and the security, secrets and LGPD rules.
read-when: you write, run or fix tests, or touch auth, permissions, secrets, personal data or security settings
skip-if: setup and daily commands → architecture/operations.md; API error shapes → architecture/api.md
---
# Quality: tests and security

## Testing
pytest + pytest-django (`pytest.ini`). **Tests need PostgreSQL** (trigram indexes; settings require `POSTGRES_DB`). From `backend/` with the compose `db` up:
```bash
venv/bin/python -m pytest apps -q     # pytest-env defaults POSTGRES_DB=erp_imobiliaria, POSTGRES_HOST=localhost; real env vars (CI, Docker) win
```
**Types:** `venv/bin/mypy apps config` must report no issues (strict, django and DRF plugins; a blocking CI step). `unfold` and `django-filter` ship no types, so `disallow_subclassing_any` is relaxed only for the admin modules and `apps.persons.filters` (`mypy.ini`); do not add `# type: ignore` elsewhere without a reason.

Inside the container install dev tools first (`pip install -r requirements-dev.txt`, lost on rebuild). Also run `manage.py check` and `makemigrations --check --dry-run`.

**Layout per app:** `tests/__init__.py`, `base.py` (helpers `body()`, `results()`, `make_*`, valid CPF/CNPJ), `conftest.py` (`api_client`, `company`, `condominium`...), `test_<topic>.py`.
`core/tests/validators/` has plain files without `__init__` (unique basenames).

| Layer | How |
|---|---|
| DB constraints | invalid row in `with pytest.raises(IntegrityError), transaction.atomic()` |
| Model rules | unsaved instance + `clean()` / validator; **no DB** |
| Serializer = model rules | `Serializer(data=...).is_valid()` proves the model's error reaches the right field as 400 |
| Nested create/update | `serializer.save()`, assert related rows |
| API contract | `APIClient` + `reverse("<basename>-list")`, payloads in the exact shape the frontend sends (nulls included) |
| Lists | pagination keys, `limit`, filters, search, 401 without token |
| Commands/seed | `call_command(...)`; idempotent; `--clear` |

Rules: every spec rule has a test; a constraint is tested twice (serializer 400 + `IntegrityError`); `pytestmark = pytest.mark.django_db` at module level for DB tests only;
valid documents (`52998224725`, `11222333000181`) except in negative tests; never depend on test order or seeded data (`core.0002` seeds one company).
**Zero warnings:** `pytest.ini` silences only WhiteNoise's missing `staticfiles` and django-unfold's `get_action_choices` deprecation; never add a broad `ignore`.

## Security
| Area | Today |
|---|---|
| Auth | `accounts.User` + SimpleJWT (access 30 min, refresh 7 days, rotating and **revoked after use** via `token_blacklist`); `POST /api/auth/logout/` revokes a refresh token; login 5/min, refresh 30/min, logout 30/min per client (Redis cache, no lockout); Django password validators |
| Authorization | `IsAuthenticated` + **company scoping** (spec 004): every queryset, related field and admin is limited to `user.company` (a superuser bypasses); `/api/companies/` creation and deletion are superuser-only. **No roles yet** (phase 7) |
| Network | CORS allow-list (`CORS_ALLOWED_ORIGINS`); `SECURE_PROXY_SSL_HEADER` for Render; `CSRF_TRUSTED_ORIGINS` from `ALLOWED_HOSTS` |
| Input | ORM only (no raw SQL); explicit serializer `fields` (no mass assignment) |

**Rules for new code**
1. Secrets only from env vars (`SECRET_KEY` also signs JWTs, ≥ 32 chars; `POSTGRES_*`, `SANTANDER_*`, `RESEND_API_KEY`); never in code, fixtures, migrations, logs or errors. `.env` is gitignored; `.env.example` holds placeholders.
2. ORM only; if raw SQL is unavoidable, parametrize.
3. Explicit serializer `fields` (never `"__all__"`); ids/timestamps/derived data `read_only`.
4. Validate on the server whatever the UI validates: a broken rule is a 400.
5. Every new endpoint states who may call it; when roles exist set `permission_classes` and scope the queryset.
6. Errors are short English strings, never stack traces. `/admin/` is staff-only, no demo users in production.
7. Certificates (e.g. `SANTANDER_CERT_PATH`) live outside the repo and web root. Pin dependencies; run `pip audit` periodically.

**Personal data (LGPD):** the system holds CPF, CNPJ, name, e-mail, phones, birth date, marital status, job, address, property ownership.
Collect only what a feature needs (each new personal field needs a reason in its spec); never log documents, e-mails, phones or tokens (log ids); expose the minimum on dashboards/search;
do not duplicate documents in other tables or caches; seeds use fictitious valid documents, never production data. No retention/erasure policy yet (a person linked to units is `PROTECT`; erasure needs a spec).

**Audit trail (spec 005):** `django-auditlog` records who created, changed or deleted each registry record (persons, documents, condominiums and their parts, units, links, cost centers, entry templates, companies, users) in the same transaction as the change. Personal fields (`Person` e-mail and phones, individual CPF/RG/birthday/marital status/job, legal CNPJ/IE) are logged as changed with the value **masked** (`[masked]`; the library's default masking keeps half the value, so `apps.core.audit.mask_personal_value` replaces it); `User` entries exclude `password` and `last_login`; the client address is not stored (`AUDITLOG_DISABLE_REMOTE_ADDR`). Only superusers see the log (Django Admin, read-only). Each app registers its models in `apps/<app>/audit.py` (called from `ready()`); a new model must be registered or listed in `AUDIT_EXEMPT` with a reason (guard test). Writes that bypass `save()` (`QuerySet.update()`, `bulk_create`, raw SQL) are not logged; commands and tasks log no actor. Finance records audit themselves (created_by, reversals).

**Transport and admin (spec 008):** plain HTTP is redirected to HTTPS and HSTS is sent (short at first) outside development; the Django Admin path comes from `ADMIN_URL`; `GET /api/health/` answers up/down only. Details and the host checklist: `architecture/operations.md`.

**Auth hardening (spec 007):** the throttle key is the client address forwarded by the Next server, trusted only with the shared secret `INTERNAL_API_KEY` (constant-time compare; required when `DEBUG=false`); a cache failure lets login through (logged). The frontend keeps tokens in `HttpOnly` cookies (`frontend/docs/safeguards/auth-and-tokens.md`). The Django Admin login is not covered by this throttle (gap #26).

**Hardening backlog (needs specs):** `SECURE_SSL_REDIRECT`/`SECURE_HSTS_SECONDS`, roles and company scoping, audit trail, HttpOnly cookie flow
(see frontend `docs/safeguards/auth-and-tokens.md`). See `known-gaps.md`.

**Review checklist:** no secret or personal data in code/logs/fixtures/errors · endpoint access defined, queryset scoped when roles exist · explicit fields, rules validated server-side · no raw SQL, new dependency reviewed.
