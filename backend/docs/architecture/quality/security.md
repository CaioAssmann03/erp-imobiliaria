---
summary: Auth, authorization, secrets, LGPD personal-data rules, hardening backlog, review checklist.
read-when: you touch auth, permissions, secrets, personal data or security settings
skip-if: deploy env vars → architecture/operations/operations.md; API error shapes → architecture/api/api-conventions.md
---
# Security and personal data

## What exists today
| Area | Implementation |
|---|---|
| Authentication | `accounts.User` + SimpleJWT: access 30 min, refresh 7 days, rotating; `/api/auth/login/`, `/api/auth/refresh/` |
| Authorization | global `IsAuthenticated` only (admins). **No roles, no per-company scoping** |
| Passwords | Django validators (similarity, min length, common, numeric) |
| CORS | allow-list from `CORS_ALLOWED_ORIGINS` (frontend origin) |
| CSRF / proxy | `SECURE_PROXY_SSL_HEADER` for Render; `CSRF_TRUSTED_ORIGINS` built from `ALLOWED_HOSTS` (admin login) |
| Hosts | `ALLOWED_HOSTS` from env |
| Static | WhiteNoise |
| SQL | ORM only; no raw SQL in the project |
| Input | serializer validation + model constraints; explicit `fields` on every serializer (no mass assignment) |

## Rules for new code
1. **Secrets** come from environment variables only (`SECRET_KEY`, `POSTGRES_*`, `SANTANDER_*`, `RESEND_API_KEY`). Never commit them or put them in fixtures,
   migrations, logs or error messages. `.env` is gitignored; `.env.example` holds placeholders only.
2. **Never use raw SQL or string-built queries**; if unavoidable, parametrize. Use the ORM (`filter`, `Q`, `Exists`).
3. **Explicit serializer `fields`**; never `"__all__"`; mark ids/timestamps/derived data `read_only`.
4. **Validate on the server** whatever the UI validates; a broken rule is a 400, never a 500 or silent acceptance.
5. **Do not trust the client for authorization**: every new endpoint states who may call it; when roles exist, set `permission_classes` and scope the queryset.
6. **Errors**: never return stack traces or internal details; messages are short English strings (the frontend translates).
7. **Admin** (`/admin/`) is a privileged surface: only staff, strong passwords, no demo users in production.
8. **Uploads/certificates** (e.g. `SANTANDER_CERT_PATH`) live outside the repo and the web root; permissions restricted.
9. **Dependencies**: pin versions (`requirements.txt`), review updates, run `pip audit` periodically; remove unused packages.

## Personal data (LGPD)
The system stores CPF, CNPJ, name, e-mail, phone numbers, birth date, marital status, job, address, property ownership.
- **Collect only what a feature needs**; every new personal field needs a reason in its feature spec.
- **Never log** documents, e-mail, phones or tokens (no `print`, no `logger.info(person)`); log ids instead.
- **Do not expose** more than the screen needs: dashboards and search return aggregates or the minimum identifying fields.
- Documents are stored digits-only and validated; do not duplicate them in other tables or caches.
- Seeds/demo data use generated, valid-but-fictitious documents; never copy production data to local or CI.
- Retention/erasure: no policy yet. A person linked to units cannot be deleted (`PROTECT`); a request to erase data needs a spec (anonymize vs delete).

## Authentication hardening backlog (needs specs)
Token blacklist on logout; login rate limiting/lockout; `SECURE_SSL_REDIRECT` and `SECURE_HSTS_SECONDS` in production (session/CSRF cookies are already Secure and `SECRET_KEY`
is mandatory when `DEBUG=false`); roles and company scoping; audit trail of who changed what;
HttpOnly cookie flow with the frontend (see frontend `docs/safeguards/auth-and-tokens.md`).

## Review checklist
- [ ] No secret or personal data in code, logs, fixtures or error messages
- [ ] Endpoint access defined; queryset scoped when roles exist
- [ ] Explicit serializer fields; rules validated server-side
- [ ] No raw SQL; new dependency reviewed
