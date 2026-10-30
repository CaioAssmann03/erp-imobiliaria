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
Also run `manage.py check` and `makemigrations --check --dry-run`. **Types:** `venv/bin/mypy apps config` is a blocking CI step (strict, django and DRF plugins); `unfold` and `django-filter` ship no types, so `disallow_subclassing_any` is relaxed only for the admin modules and `apps.persons.filters`: do not add `# type: ignore` elsewhere without a reason.

**Layout per app:** `tests/` with `base.py` (helpers `body()`, `errors()`, `make_*`, valid CPF/CNPJ), `conftest.py` (`api_client`, `company`, `condominium`...) and `test_<topic>.py`.

| Layer | How |
|---|---|
| DB constraints | an invalid row inside `with pytest.raises(IntegrityError), transaction.atomic()` |
| Model rules | an unsaved instance + `clean()` / validator; **no DB** |
| Serializer = model rules | `Serializer(data=...).is_valid()` proves the model's error reaches the right field as a 400 |
| Nested create/update | the service, or `serializer.save()`; assert the related rows |
| API contract | `APIClient` + `reverse("<basename>-list")`, payloads in the exact shape the frontend sends (nulls included) |
| Lists | pagination keys, `limit`, filters, search, 401 without a token |
| Commands/seed | `call_command(...)`; idempotent; `--clear` |

Every rule has a test; a constraint is tested twice (serializer 400 + `IntegrityError`); `pytestmark = pytest.mark.django_db` only for DB tests; valid documents (`52998224725`, `11222333000181`) except in negative tests; never depend on test order or seeded data (`core.0002` seeds one company). **Zero warnings:** `pytest.ini` silences only WhiteNoise's missing `staticfiles` and django-unfold's `get_action_choices`; never add a broad `ignore`.

## Security
| Area | Today |
|---|---|
| Auth | Passwords hashed with **Argon2id** (spec 023). SimpleJWT signed with **EdDSA (Ed25519)** from `JWT_SIGNING_KEY` (spec 022; access 30 min, refresh 7 days, rotating and **revoked after use**); logout revokes a refresh token; login 5/min, refresh 30/min, logout 30/min per client on a Redis cache, no lockout. The throttle key is the client address forwarded by the Next server, trusted only with the shared `INTERNAL_API_KEY` (mandatory when `DEBUG=false`); a cache failure lets login through (logged). The Django Admin login is not throttled (gap #26). The frontend keeps tokens in `HttpOnly` cookies (`frontend/docs/safeguards/auth-and-tokens.md`) |
| Authorization | `IsAuthenticated` + **company scoping**: every queryset, related field and admin is limited to `user.company` (a superuser bypasses); `/api/companies/` create and delete are superuser-only. **No roles yet** (phase 7) |
| Network | CORS allow-list (`CORS_ALLOWED_ORIGINS`); `SECURE_PROXY_SSL_HEADER` for a TLS-terminating proxy; plain HTTP redirected to HTTPS with a short HSTS; the Admin path comes from `ADMIN_URL` (`operations.md`) |
| Input | ORM only (no raw SQL); explicit serializer `fields` |

**Rules for new code**
1. Secrets only from env vars (`SECRET_KEY` ≥ 32 chars; `JWT_SIGNING_KEY` signs the JWTs); never in code, fixtures, migrations, logs or errors. `.env` is gitignored; `.env.example` holds placeholders.
2. ORM only; if raw SQL is unavoidable, parametrize.
3. Explicit serializer `fields` (never `"__all__"`: a new model field must not reach the API unreviewed); ids, timestamps and derived data `read_only`.
4. Validate on the server whatever the UI validates: a broken rule is a 400.
5. Every new endpoint states who may call it; when roles exist set `permission_classes` and scope the queryset.
6. Errors are short English strings, never stack traces. `/admin/` is staff-only, no demo users in production.
7. Certificates live outside the repo and web root. Pin dependencies; run `pip audit` periodically.

**Personal data (LGPD):** the system holds CPF, CNPJ, name, e-mail, phones, birth date, marital status, job, address and property ownership. Collect only what a feature needs (a new personal field needs a reason in its spec); never log documents, e-mails, phones or tokens (log ids); expose the minimum on dashboards and search; do not duplicate documents in other tables or caches; seeds use fictitious valid documents. No retention or erasure policy yet (a person linked to units is `PROTECT`; erasure needs a spec).

**Deleting and the LGPD (spec 062):** a registry record (condominium, block, unit, person, supplier, sub-conta) is archived, never removed: it leaves every query but stays in the database with its history, and the audit trail keeps masking personal values. The LGPD erasure of a person is a separate, irreversible anonymization (superuser, after the retention period), see `apps/persons.md`. A write that bypasses `delete()` (`QuerySet.update()`, raw SQL) bypasses the archive rules too.

**Audit trail:** `django-auditlog` records who created, changed or deleted each registry record, in the same transaction. Personal fields and bank data are logged as changed with the value masked (`[masked]`); `User` entries exclude `password` and `last_login`; the client address is not stored; only superusers see the log (Admin, read-only). Each app registers its models in `apps/<app>/audit.py`; a new model must be registered or listed in `AUDIT_EXEMPT` with a reason (guard test). Writes that bypass `save()` (`QuerySet.update()`, `bulk_create`, raw SQL) are not logged; commands and tasks log no actor.

**Review checklist:** no secret or personal data in code, logs, fixtures or errors · endpoint access defined and queryset scoped · explicit fields, rules validated server-side · no raw SQL, new dependency reviewed.
