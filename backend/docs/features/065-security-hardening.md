---
summary: Backend security hardening from the 2026-11-01 review: closed API docs, DEBUG off by default, username lockout (Admin included), a default rate limit, webhook limits, receipt file signatures, dependency audits and a non-root container.
read-when: you touch DEBUG/SECRET_KEY defaults, the API docs endpoints, login lockout (django-axes), throttles, receipt confirmation, the Dockerfile or the CI security steps
skip-if: how JWT login works → apps/accounts.md; the security policy table → architecture/quality.md; roles and permissions → roadmap phase 7
---
# 065 — Security hardening

**Status:** done · **Level:** full · **Roadmap:** none · **Apps:** accounts, core, billing, finance · **Frontend impact:** client regeneration

## Open questions
- [x] Lock by username only, by IP only, or both? (decided: see Decisions)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-01 | Lockout (django-axes) is keyed by **username only**: the per-IP login throttle already exists and, behind the Next server, an IP is not a reliable key; a distributed attack on one account is what the lock stops. The cost is that someone who knows a username can lock that account for the cool-off (15 min). | agent, to be confirmed |
| 2026-11-01 | The API docs (`/api/schema/`, `/api/docs/`) stay open only when `DEBUG=true` (the frontend client is generated from them); with `DEBUG=false` they need a superuser token. | agent, to be confirmed |
| 2026-11-01 | Items 13 (test-only keys) and 14 (`localhost` in `ALLOWED_HOSTS` for the Admin tunnel) of the review are not changed: the first is a check on the VPS, the second is what makes the tunnel work. | the user (not requested) |

## R — Requirements
- [x] R1 — With `DEBUG=false`, `/api/schema/` and `/api/docs/` answer 401 without a token and 403 to a user that is not a superuser; with `DEBUG=true` they stay open.
- [x] R2 — `DEBUG` is **off** unless `DEBUG=true` is set. With it off, `SECRET_KEY` is mandatory, at least 32 characters and not the development fallback.
- [x] R3 — After 10 failed logins for the same username (API login or Admin login) that username is locked for 15 minutes: the API answers 429 (`throttled`), the Admin 429, a correct password is refused too, a successful login resets the counter.
- [x] R4 — Every authenticated API call is limited to 600 per minute per user (429 above it); login, refresh and logout keep their own limits.
- [x] R5 — The Asaas webhook is limited to 1000 calls per minute and the Resend webhook to 300, per client address.
- [x] R6 — Confirming a receipt checks the first bytes of the stored file against the declared type (PDF, JPEG, PNG); a file that does not match is deleted and refused with `payment_receipt.file.content_mismatch`.
- [x] R7 — CI runs `pip-audit` and `pnpm audit --prod --audit-level=high` (both blocking); Dependabot opens weekly updates for pip, npm, Docker and GitHub Actions.
- [x] R8 — `backend/dump.rdb` is no longer versioned and is ignored; the backend image runs as an unprivileged user.

## E — Entities
`django-axes` adds its own tables (applied with `migrate`) (`axes_accessattempt`, `axes_accesslog`, `axes_accessfailurelog`); no project model changes.

## A — Approach
Settings and third-party hooks only; the one business-adjacent change is the receipt signature check, a pure function in `finance/validators.py` called by the existing confirm service. Rejected: locking by IP+username (does not stop a distributed attack), a custom lockout (more code than the library), a hash column to speed up the webhook token lookup (needs a data migration; the rate limit removes the amplification).

## S — Structure
`config/settings.py`, `pytest.ini`, `requirements.txt`, `apps/accounts/{serializers/login_serializers.py,views/auth_views.py}`, `apps/billing/views/gateway_webhook_views.py`, `resend_webhook_views.py`, `apps/core/infrastructure/storage/object_storage.py` (`read_head`), `apps/finance/{validators.py,errors/payment_receipt.py,services/confirm_payment_receipt.py}`, `Dockerfile`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.gitignore`.

## O — Operations
1. Settings and dependency (`django-axes`, migration applied on deploy). 2. Webhook throttles. 3. Receipt signature check. 4. CI, Dependabot, Dockerfile, `.gitignore`, `git rm --cached backend/dump.rdb`. 5. Docs.

## N — Norms
`architecture/quality.md` (security table) and `known-gaps.md` (#26 closed) are updated with the change.

## S — Safeguards
- **Deploy:** the VPS `.env` must have `DEBUG=false`, `SECRET_KEY` ≥ 32 characters and `INTERNAL_API_KEY` (already required); a missing `DEBUG` now means production, not development. Local runs outside Docker need `DEBUG=true` exported (the `.env` already has it).
- **Lockout trade-off:** see Decisions. A locked superuser is released from the Admin (*Tentativas de acesso*) or with `python manage.py axes_reset_username <name>`.
- **Throttle failures** let the request through (logged), as the login throttle already does.
- **Container user:** files the app writes (`staticfiles/`, `celerybeat-schedule`) live in `/app`, owned by that user.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_api_docs_access.py` |
| R2 | `apps/core/tests/test_security_settings.py` |
| R3 | `apps/accounts/tests/test_login_lockout.py` |
| R4 | `apps/core/tests/test_default_throttle.py` |
| R5 | `apps/billing/tests/test_webhook_throttle.py` |
| R6 | `apps/finance/tests/test_payment_receipts.py::test_confirm_rejects_and_deletes_a_file_that_is_not_its_declared_type`, `::test_a_file_signature_matches_its_type` |
| R7 | N/A — CI configuration, checked by the first CI run |
| R8 | N/A — repository and image configuration |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated
