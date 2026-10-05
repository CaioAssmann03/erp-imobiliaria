---
summary: Plan and status of part 09 of phase 3a — Operational hardening: health, HTTPS, admin path.
read-when: you work on operational hardening: health, https, admin path before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 09 — Operational hardening: health, HTTPS, admin path

**Status:** in-progress · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** core, config · **Frontend impact:** none · **Depends on:** 01, 08
**Spec:** [008 — Operational hardening](../../features/008-operational-hardening.md)

## Goal
A cheap health endpoint, HTTPS enforcement with a safe HSTS, and a non-default admin path. Decided in gaps #15, #18 and #20.

## Scope
- [x] `GET /api/health/`: no auth, 200 if the app runs and `SELECT 1` works, else 503; point the host's health check at it
- [x] `SECURE_SSL_REDIRECT` and `SECURE_HSTS_SECONDS` from env (default 3600 s in production, no `includeSubDomains`/`preload`); `/api/health/` exempt from the redirect
- [x] `ADMIN_URL` from env (default `admin/`; production sets a non-obvious path)
- [ ] Update `architecture/operations.md`, `architecture/quality.md`, `.env.example`; delete gap #18 and the health/admin parts of #15 and #20

## Draft for the spec
Moved to the spec.

## Result
Implemented on 2026-10-05; **waiting on one manual check** (R8: the host checklist in `architecture/operations.md`, which needs the backend host chosen in part 01), so the part stays `in-progress` and spec 008 too.
Delivered: `HealthCheckMiddleware` first in `MIDDLEWARE` (`GET`/`HEAD /api/health/`: 200 `{"status":"ok"}` or 503 `{"status":"unavailable"}`, answered before the HTTPS redirect and the host check); `SECURE_SSL_REDIRECT` (default on when `DEBUG=false`) and `SECURE_HSTS_SECONDS` (default 3600, no subdomains/preload) from env; `ADMIN_URL` (normalized, invalid values stop startup) with the `core.W001` production warning; the test suite forces plain HTTP (`conftest.py`) because CI runs with `DEBUG=false`; `render.yaml` health check now `/api/health/`; gaps #18 and #20 deleted, #15 trimmed to the structured logs.
Checked: `pytest apps -q` 379 passed, `mypy apps config` clean.
To close: pick the backend host (part 01), run the checklist, tick R8, set spec 008 and this part to `done`, then raise `SECURE_HSTS_SECONDS` to a year when the final domain exists.