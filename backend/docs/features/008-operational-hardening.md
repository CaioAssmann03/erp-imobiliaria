---
summary: Spec: a minimal /api/health/ (app + database), HTTPS redirect and a short HSTS configurable by env, and a configurable admin path (ADMIN_URL); written to be independent of the hosting provider, with a verification checklist for when the host is chosen.
read-when: you touch the health check, SECURE_SSL_REDIRECT, HSTS, ADMIN_URL, the host's health probe or the production security headers
skip-if: token, login and cookie hardening, or the change audit trail → features/history.md (sections 007 and 005); deploy topology and the runbook → architecture/operations.md
---
# 008 — Operational hardening: health, HTTPS, admin path

**Status:** in-progress · **Level:** full · **Roadmap:** phase 3a part 09 · **Apps:** core, config (settings, urls) · **Frontend impact:** none

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | A lightweight `GET /api/health/`: no auth, 200 if the app runs and `SELECT 1` works, else 503; the host's health check points at it (gap #15) | the user |
| 2026-10-05 | `SECURE_SSL_REDIRECT` and `SECURE_HSTS_SECONDS` come from env (default 3600 s in production, no `includeSubDomains`/`preload`); the health path is exempt from the redirect; HSTS goes to one year when the final domain exists (gap #18) | the user |
| 2026-10-05 | `ADMIN_URL` comes from env (default `admin/`, production sets a non-obvious path); this is obscurity, not security: strong passwords and the login throttle remain the protection (gap #20) | the user |
| 2026-10-05 | The spec is host-agnostic (everything by env and the standard proxy header) and carries a verification checklist for when the backend host is chosen (part 01) | the user |
| 2026-10-05 | The health check covers the app and the database only; Redis is not checked (login proceeds unthrottled if the cache fails, spec 007) | the user |
| 2026-10-05 | Structured JSON logs stay out of this spec (before go-live, gap #15) | the user |
| 2026-10-05 | `SECURE_REDIRECT_EXEMPT` is not used: the health middleware answers before `SecurityMiddleware`, so the exemption holds by construction | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | The health check is a middleware placed **before** `SecurityMiddleware` and host validation, so a probe that arrives over plain HTTP with an internal host header (an IP, a service name) gets its answer, and the redirect exemption holds by construction | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The health body is minimal: `{"status": "ok"}` or `{"status": "unavailable"}`, GET and HEAD only; database errors are logged, never returned; the path is not in the OpenAPI schema | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Defaults: `SECURE_SSL_REDIRECT` is true when `DEBUG=false`, false in development; `SECURE_HSTS_SECONDS` is 3600 when `DEBUG=false`, 0 in development | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `ADMIN_URL` is normalized (no leading slash, one trailing slash); an empty value, a value with `://` or `..` stops startup (`ImproperlyConfigured`); a Django system check **warns** in production while it is still `admin/` | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `API_INTERNAL_URL` (the Next server's call to Django) must be `https` in production, or the platform's private network must send `X-Forwarded-Proto: https`; otherwise the redirect breaks the server-to-server calls of spec 007 | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
There is no cheap health probe (the host uses `/api/schema/`, which builds the whole OpenAPI schema), no HTTPS enforcement or HSTS, and `/admin/` sits on the default public path.
- [x] R1 — `GET /api/health/` (and `HEAD`) needs no authentication and answers 200 `{"status": "ok"}` when the app runs and `SELECT 1` succeeds, 503 `{"status": "unavailable"}` when the database does not answer; the body has nothing else; other methods are not handled by the health check
- [x] R2 — The health answer does not depend on `ALLOWED_HOSTS` or on HTTPS: a request over plain HTTP with an arbitrary `Host` still gets it
- [x] R3 — With `SECURE_SSL_REDIRECT` on (the production default), a plain HTTP request to any other path answers a redirect to HTTPS; the variable can turn it off
- [x] R4 — On HTTPS responses `Strict-Transport-Security` carries `max-age` from `SECURE_HSTS_SECONDS` (production default 3600), without `includeSubDomains` or `preload`; in development there is no header
- [x] R5 — The admin is served at `ADMIN_URL` (default `admin/`); when it is changed the old path answers 404; the value is normalized and an invalid one stops startup
- [x] R6 — A Django system check warns in production while `ADMIN_URL` is still the default
- [x] R7 — `.env.example`, `architecture/operations.md`, `architecture/overview.md` and `architecture/quality.md` document the three variables, the health path and the verification checklist; the host's health check configuration points at `/api/health/`
- [ ] R8 — Once the backend host is chosen, the checklist in `architecture/operations.md` is run and ticked: the platform terminates TLS and sends `X-Forwarded-Proto`, its health check uses `/api/health/`, `API_INTERNAL_URL` is https
- [x] R9 — Gap #18 and the admin-path half of gap #20 are deleted; gap #15 keeps only the structured-logs part

## E — Entities
No models or migrations.
| Setting / env | Default | Notes |
|---|---|---|
| `SECURE_SSL_REDIRECT` (env `SECURE_SSL_REDIRECT`) | `not DEBUG` | boolean env |
| `SECURE_HSTS_SECONDS` (env) | `3600` if `not DEBUG`, else `0` | integer env; `SECURE_HSTS_INCLUDE_SUBDOMAINS=False`, `SECURE_HSTS_PRELOAD=False` fixed |
| `ADMIN_URL` (env) | `admin/` | normalized in settings; used by `config/urls.py` |

## A — Approach
- **Health as a middleware at the top of `MIDDLEWARE`.** It answers `/api/health/` for GET and HEAD before `SecurityMiddleware` (redirect) and before anything that validates the host, so probes with an internal host or over HTTP work. The database check is `connection.cursor().execute("SELECT 1")` inside a `try`; any exception is logged (type and message, no personal data) and the answer is 503. Alternatives rejected: a DRF view (it would be subject to the redirect, `ALLOWED_HOSTS` and authentication defaults) and `SECURE_REDIRECT_EXEMPT` plus a view (two moving parts and still host-validated).
- **Security settings read from env in `config/settings.py`**, next to the existing `SECURE_PROXY_SSL_HEADER`; no new dependency.
- **Admin path** from `ADMIN_URL` in `config/urls.py`; a system check in `apps/core/checks.py` registers the production warning.
- **Host-agnostic:** nothing names a provider. What a provider must offer (TLS termination, `X-Forwarded-Proto`, an HTTP health probe on a path) is written once in `architecture/operations.md` as a checklist and verified when part 01 settles the host.
- **Rejected:** `django-axes` or an IP allow-list for the admin (gap #26, later); HSTS for a year now (the domain is not final); checking Redis in health.

## S — Structure
| File | Change |
|---|---|
| `apps/core/middleware.py` | new: `HealthCheckMiddleware` |
| `config/settings.py` | middleware first in the list; `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, `ADMIN_URL` parsing and validation |
| `config/urls.py` | `path(settings.ADMIN_URL, admin.site.urls)` |
| `apps/core/checks.py`, `apps/core/apps.py` | production warning for the default admin path (registered in `ready()`) |
| `apps/core/tests/infrastructure/test_health.py`, `apps/core/tests/infrastructure/test_security_settings.py`, `apps/core/tests/infrastructure/test_admin_url.py` | tests (the settings ones follow the subprocess pattern of `test_core_settings.py`) |
| `.env.example`, `docker-compose.yml`, the host's deploy file (part 01) | variables and the health check path |
| `docs/architecture/operations.md`, `overview.md`, `quality.md`, `known-gaps.md` | docs and the checklist |
Endpoint:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET, HEAD | `/api/health/` | - | 200 `{"status": "ok"}` / 503 `{"status": "unavailable"}` | no auth, no schema entry; answered by the middleware |

## O — Operations
Depends on phase 3a part 01 (hosting variables) and part 08 (spec 007 adds `INTERNAL_API_KEY` and the server-to-server URL this spec constrains).
1. Middleware and its tests (database up, database down, odd host, plain HTTP, methods).
2. Security settings (`SECURE_SSL_REDIRECT`, HSTS) with tests of the defaults and of the headers.
3. `ADMIN_URL`: parsing, validation, urls, check; tests.
4. `.env.example`, compose and the host's deploy file; docs and the checklist.
5. When the backend host is chosen: run the checklist (R8), then delete gaps #18 and the admin-path half of #20, trim #15.

## N — Norms
`architecture/quality.md` (secrets and config from env, no personal data in logs), `architecture/operations.md` (runbook), `conventions/naming.md`. Settings tests use the subprocess pattern already in `apps/core/tests/infrastructure/test_core_settings.py`.

## S — Safeguards
- **Information exposure:** the health answer reveals nothing but up or down; errors stay in the logs.
- **Availability:** a failing database makes the probe fail and the host may restart the app: intended. Redis is not part of the probe on purpose.
- **HSTS stickiness:** a browser remembers HSTS for `max-age`; 3600 s limits the damage of a wrong domain or a broken certificate; the raise to a year is a conscious later step with the final domain.
- **Redirect and server-to-server calls:** with the redirect on, a plain-HTTP `API_INTERNAL_URL` in production would loop or fail; it must be https or arrive with `X-Forwarded-Proto: https` (decision above, checklist item).
- **Admin path:** obscurity only; the path is not a secret and may leak in logs and referers; the real protection is strong passwords, staff-only access and the audit trail (spec 005). The Django Admin login still has no throttle (gap #26).
- **Compatibility:** nothing changes for API clients; the old `/admin/` path stops working only when `ADMIN_URL` is set to something else, so bookmarks and docs must be updated at that moment.
- **Failure mode:** an invalid `ADMIN_URL` stops startup with a clear message instead of silently exposing or hiding the admin.

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/infrastructure/test_health.py::test_health_is_ok_when_the_database_answers`, `::test_health_is_503_when_the_database_fails`, `::test_health_body_has_only_status`, `::test_health_handles_get_and_head_only`, `::test_health_needs_no_authentication` |
| R2 | `apps/core/tests/infrastructure/test_health.py::test_health_ignores_allowed_hosts`, `::test_health_answers_over_plain_http_with_ssl_redirect_on` |
| R3 | `apps/core/tests/infrastructure/test_security_settings.py::test_http_request_is_redirected_when_ssl_redirect_is_on`, `::test_https_request_is_not_redirected`, `::test_ssl_redirect_defaults_on_in_production_and_off_in_development`, `::test_ssl_redirect_can_be_turned_off_by_env` |
| R4 | `apps/core/tests/infrastructure/test_security_settings.py::test_hsts_header_on_https_responses`, `::test_hsts_defaults_and_no_subdomains_or_preload`, `::test_hsts_can_be_raised_by_env`, `::test_no_hsts_in_development` |
| R5 | `apps/core/tests/infrastructure/test_admin_url.py::test_admin_is_served_at_admin_url_by_default`, `::test_old_admin_path_is_404_after_change`, `::test_admin_url_is_normalized`, `::test_invalid_admin_url_stops_startup` (fresh interpreters) |
| R6 | `apps/core/tests/infrastructure/test_admin_url.py::test_check_warns_in_production_with_the_default_path`, `::test_check_is_silent_with_a_custom_path_or_in_development` |
| R7 | gap: documentation has no test; `architecture/operations.md` (variables, health path, checklist), `overview.md`, `quality.md` and `.env.example` updated; `render.yaml` now points the health check at `/api/health/`; checked by review and `python backend/docs/tools/check_docs.py` |
| R8 | **pending**: depends on the chosen backend host (phase 3a part 01); run the checklist in `architecture/operations.md` on the real environment and tick it |
| R9 | gap: documentation has no test; gaps #18 and #20 are deleted and #15 keeps only the structured logs; checked by review |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan (R8 is the pending host checklist, a manual verification)
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed — `N/A — no API change (the health path is outside the schema)`
- [ ] `docs/architecture/operations.md` (variables, health path, verification checklist ticked on the chosen host), `overview.md`, `quality.md`, `.env.example` updated; gap #18 deleted, the admin-path half of #20 and the health part of #15 removed from `docs/known-gaps.md`
- [ ] Roadmap part 09 and the phase 3a table updated; index in `features/README.md` updated
