---
summary: Plan and status of part 08 of phase 3a — Auth hardening: logout, throttle, HttpOnly cookies.
read-when: you work on auth hardening: logout, throttle, httponly cookies before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 08 — Auth hardening: logout, throttle, HttpOnly cookies

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** accounts, core, frontend · **Frontend impact:** client regeneration · **Depends on:** 05, 07
**Spec:** [007 — Auth hardening](../../features/history.md) (section 007)

## Goal
Refresh tokens can be revoked, login is rate limited, and the frontend no longer keeps tokens where JavaScript can read them. Decided in gaps #3 and #15 (throttle part).

## Scope
- [x] Enable `rest_framework_simplejwt.token_blacklist` and `BLACKLIST_AFTER_ROTATION`
- [x] `POST /api/auth/logout/` that blacklists the refresh token
- [x] Redis-backed `CACHES` and DRF `ScopedRateThrottle` on login and refresh (no account lockout)
- [x] Frontend: tokens in HttpOnly cookies through Next route handlers (the browser never reads the token)
- [x] Update `architecture/quality.md`, `architecture/overview.md`, frontend `docs/safeguards/auth-and-tokens.md`; delete gap #3

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 007 `done`). Backend: `token_blacklist` + `BLACKLIST_AFTER_ROTATION`; `POST /api/auth/logout/` (idempotent 204); login 5/min, refresh 30/min, logout 30/min per client on a Redis `CACHES` (a cache failure lets the request through, logged); the throttle key is the client address forwarded by the Next server and trusted only with `INTERNAL_API_KEY` (mandatory when `DEBUG=false`; added to the CI env). Frontend: tokens only in `HttpOnly` cookies written by the server; one same-origin handler (`app/api/[...path]/route.ts`) serves login, logout and a JSON proxy with renewal, a CSRF origin check and a shared refresh; `proxy.ts` uses the same cookie helper; `NEXT_PUBLIC_API_URL` is gone from the browser.
Checked: `pytest apps -q` 351 passed, `mypy apps config` clean, frontend `tsc`, `eslint` and `build` clean. Verified **by hand end to end** (Django under gunicorn with 2 workers on the compose Redis + `next dev`): login, cookies, proxy, transparent renewal, concurrent refresh, CSRF, 415, logout revocation, and the throttle across workers (see the spec's Test plan).
Deviations to confirm with the user (spec Decisions): one catch-all handler file instead of three; the own-origin rule; the 30 s shared refresh; the `bad_gateway` code.
**Still to do elsewhere:** `render.yaml` still mentions `NEXT_PUBLIC_API_URL` and has no `INTERNAL_API_KEY` (replaced in phase 3a part 01); the compose `backend` container needs its database recreated (`docker compose down -v`) because the migrations were reset.