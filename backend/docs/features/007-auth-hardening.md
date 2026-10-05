---
summary: Spec: refresh tokens can be revoked (blacklist + logout), login and refresh are rate limited on a shared Redis cache, and the frontend keeps tokens only in HttpOnly cookies through same-origin Next route handlers that proxy the JSON API.
read-when: you touch login, logout, refresh, token storage, cookies, the Next API proxy, the throttle, INTERNAL_API_KEY or the client IP handling
skip-if: company scoping → features/004-company-scoping.md; error body and codes (incl. 429) → features/006-error-codes-and-contract.md; roles and the customer portal → roadmap/phase-7-client-portal/01-portal-auth-and-permissions.md; headers, HTTPS and the health check → roadmap/phase-3a-prerequisites/09-operational-hardening.md
---
# 007 — Auth hardening: logout, throttle, HttpOnly cookies

**Status:** done · **Level:** full · **Roadmap:** phase 3a part 08 · **Apps:** accounts, core, frontend · **Frontend impact:** client regeneration (new logout endpoint, browser base URL) and a rewritten login/logout/proxy layer

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Enable `token_blacklist`, `BLACKLIST_AFTER_ROTATION` and `POST /api/auth/logout/`, and move the frontend to HttpOnly cookies, in this one spec (gap #3) | the user |
| 2026-10-05 | Throttle login and refresh with DRF `ScopedRateThrottle` on a Redis-backed cache; no account lockout (gap #15) | the user |
| 2026-10-05 | Rates: login 5/min, refresh 30/min, per key; the 429 uses the `throttled` code of spec 006 | the user |
| 2026-10-05 | The Next route handlers proxy **all JSON** API calls (the token never reaches the browser); files go by signed bucket URLs, decided in the file-storage spec of phase 3 (Vercel functions cap bodies near 4.5 MB) | the user |
| 2026-10-05 | The throttle key is the real client IP forwarded by Next, trusted only when a shared secret header matches (`INTERNAL_API_KEY`) | the user |
| 2026-10-05 | The frontend is on Vercel; the cookie lives on the Vercel domain and the Next handlers call Django server to server, so the backend domain does not matter for cookies (part 01) | the user |
| 2026-10-05 | `POST /api/auth/logout/` is idempotent and always answers 204 (an expired or unknown refresh token is not an error and never reveals its validity) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The access cookie's `maxAge` equals the JWT lifetime (30 min, today it is 1 day); the refresh cookie lasts 7 days; `proxy.ts` keeps refreshing page requests | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `INTERNAL_API_KEY` is mandatory when `DEBUG=false` (startup fails otherwise, like `SECRET_KEY`) and is compared in constant time | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Route handlers: `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts` and the catch-all `app/api/[...path]/route.ts`; the browser calls same-origin `/api/...`, so `NEXT_PUBLIC_API_URL` leaves the browser bundle and `API_INTERNAL_URL` becomes a private server variable | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | CSRF guard in the handlers: a non-GET request whose `Origin` (or `Sec-Fetch-Site`) is not same-origin answers 403, on top of `SameSite=Lax` | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Backend throttle tests run on a local-memory cache; the cross-worker property is verified once with the compose Redis, and written as a gap in the Test plan | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | One catch-all handler (`app/api/[...path]/route.ts`) serves login, logout and the JSON proxy, instead of three route files: Next redirects trailing-slash URLs (`/api/auth/login/`), and `next.config.ts` turns that redirect off (`skipTrailingSlashRedirect`) so one file with the path normalized does it all | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | The own origin for the CSRF check is `x-forwarded-host`/`host` + `x-forwarded-proto` (not `request.nextUrl.origin`, which in development is the server's own name) | agent, found while smoke testing; **not yet confirmed by the user** |
| 2026-10-05 | The Next server shares one refresh per token for 30 s (the rotation revokes the old token while the screen fires several requests with the same cookie) | agent, found while designing the handler; **not yet confirmed by the user** |
| 2026-10-05 | New generic code `bad_gateway` (502) for an unreachable Django | agent, **not yet confirmed by the user** |
| 2026-10-05 | The Django Admin login (`/admin/login/`) is not covered by this throttle; a new gap (#26) records it | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | If the cache (Redis) fails, login proceeds unthrottled and the error is logged (availability over the rate limit) | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
Refresh tokens cannot be revoked today, login can be brute-forced, and tokens sit in cookies JavaScript can read (`frontend/docs/safeguards/auth-and-tokens.md`).
- [x] R1 — `rest_framework_simplejwt.token_blacklist` is installed; with `ROTATE_REFRESH_TOKENS` and `BLACKLIST_AFTER_ROTATION` a used refresh token cannot be used again (401 `token_not_valid`)
- [x] R2 — `POST /api/auth/logout/` with `{refresh}` blacklists that refresh token and answers 204; the same call again, an expired token or garbage also answers 204
- [x] R3 — Login is limited to 5 requests per minute and refresh to 30 per minute per key (logout 30); the 6th login in a minute answers 429 with the `throttled` code in the `{errors: [...]}` shape of spec 006
- [x] R4 — The key is the client IP taken from `X-Forwarded-For` only when the request carries a matching `X-Internal-Key`; otherwise it is the connection's address; `INTERNAL_API_KEY` is required in production
- [x] R5 — The throttle counters live in a Redis cache (`CACHES` from `REDIS_URL`), so they hold across gunicorn workers
- [x] R6 — The browser never sees a token: login and refresh bodies reach it without tokens, the cookies are `HttpOnly; Secure` (production) `; SameSite=Lax`, and no frontend code reads or writes the access or refresh cookie
- [x] R7 — The Next handlers serve login, logout and a catch-all proxy of the JSON API; the proxy adds `Authorization: Bearer` from the cookie, refreshes once when the access token is expired or the API answers 401 (setting the new cookies), and on a failed refresh clears the cookies and answers 401
- [x] R8 — A non-GET request to the handlers with a foreign `Origin` answers 403
- [x] R9 — The browser calls only same-origin `/api/...`; `NEXT_PUBLIC_API_URL` is gone from browser code; `API_INTERNAL_URL` and `INTERNAL_API_KEY` are server-only and documented in `.env.example` and the compose file
- [x] R10 — The UI logout calls the logout handler, which revokes the refresh token in Django and clears the cookies; the old refresh token then fails
- [x] R11 — `proxy.ts` (the page guard) and the handlers share one helper for the cookie names, flags and lifetimes (access = JWT lifetime, refresh = 7 days)
- [x] R12 — `architecture/quality.md`, `architecture/overview.md`, the frontend `safeguards/auth-and-tokens.md` describe the new flow; gap #3 and the throttle part of gap #15 are removed, gap #26 is added

## E — Entities
No project model changes. `token_blacklist` adds its own tables (`OutstandingToken`, `BlacklistedToken`) with the library's migrations.
| Item | Change |
|---|---|
| `SIMPLE_JWT` | `BLACKLIST_AFTER_ROTATION: True` (rotation is already on) |
| `CACHES` | `default` = Django `RedisCache` on `REDIS_URL` (TLS `rediss://` accepted) |
| `REST_FRAMEWORK` | `DEFAULT_THROTTLE_RATES = {"auth_login": "5/min", "auth_refresh": "30/min", "auth_logout": "30/min"}`; `NUM_PROXIES` is not used (the key logic is ours) |
| env | `INTERNAL_API_KEY` (backend and frontend, same value); `API_INTERNAL_URL` (frontend, server only) |

## A — Approach
- **Backend.** `apps/accounts/views/auth_views.py` subclasses SimpleJWT's login and refresh views with a `throttle_scope`, and adds `LogoutView` (`RefreshToken(token).blacklist()` inside a `try`, always 204). `apps/core/throttling.py` holds `TrustedProxyScopedRateThrottle`, a `ScopedRateThrottle` whose `get_ident` returns the forwarded IP only when the `X-Internal-Key` header equals `settings.INTERNAL_API_KEY` (`hmac.compare_digest`), otherwise the connection address. The 429 goes through the exception handler of spec 006.
- **Why a shared secret instead of trusting the header:** the proxy is the only caller that may speak for a client's IP; anyone else could forge `X-Forwarded-For` to dodge the limit. Alternatives rejected: key by username only (lets an attacker lock a real user out) and DRF `NUM_PROXIES` (needs a fixed, known proxy count, which the hosting does not guarantee).
- **Frontend: the Next server is the only holder of tokens.** Login handler: posts to Django (adding `X-Forwarded-For` from Vercel's header and `X-Internal-Key`), sets the two cookies and returns `204`. Logout handler: sends the refresh cookie to the logout endpoint, clears the cookies. Catch-all proxy: maps `/api/<path>` to `${API_INTERNAL_URL}/api/<path>` for JSON requests, adds the bearer token, handles the one refresh-and-retry, forwards status and JSON body unchanged (the shape is spec 006's), never forwards the browser's `Cookie` header to Django and never returns Django's headers other than content type.
- **Server-side rendering is unchanged in spirit:** Server Components still read the cookie through `next/headers` and call Django directly; `proxy.ts` keeps renewing the token before the page renders (only its cookie flags and `maxAge` change).
- **`lib/api-client.ts`** loses the token logic: in the browser it calls same-origin `/api`, and a 401 (the handler already tried to refresh) clears nothing in JS and navigates to `/login`. `lib/cookies.ts` keeps only non-sensitive cookies (sidebar, appearance).
- **Out of scope:** files (signed URLs, phase 3), roles (phase 7), the admin login throttle (gap #26), headers/HTTPS/health (part 09).

## S — Structure
| File | Change |
|---|---|
| `config/settings.py` | `token_blacklist` in `INSTALLED_APPS`; `BLACKLIST_AFTER_ROTATION`; `CACHES`; throttle rates; `INTERNAL_API_KEY` (mandatory when `DEBUG=false`) |
| `apps/core/throttling.py` | new: `TrustedProxyScopedRateThrottle` |
| `apps/accounts/views/auth_views.py` | new: throttled login and refresh views, `LogoutView`; `apps/accounts/serializers/` for the logout body; `config/urls.py` routes |
| `apps/accounts/tests/test_auth_logout.py`, `test_auth_throttle.py`, `test_auth_blacklist.py` | tests |
| `.env.example`, `docker-compose.yml`, `render.yaml` or its replacement (part 01) | `INTERNAL_API_KEY`, `API_INTERNAL_URL`; `NEXT_PUBLIC_API_URL` removed from the frontend |
| `frontend/lib/auth-cookies.ts` | new (server only): names, flags, lifetimes, set/clear helpers |
| `frontend/app/api/auth/login/route.ts`, `frontend/app/api/auth/logout/route.ts`, `frontend/app/api/[...path]/route.ts` | new handlers |
| `frontend/proxy.ts` | uses the helper; correct `maxAge` and flags |
| `frontend/lib/api-client.ts`, `frontend/lib/cookies.ts` | token logic removed; same-origin base URL |
| `frontend/app/login/_components/LoginForm.tsx`, `frontend/app/(dashboard)/_components/shell/LogoutButton.tsx` | call the handlers |
| `frontend/docs/safeguards/auth-and-tokens.md`, `docs/architecture/quality.md`, `architecture/overview.md`, `known-gaps.md` | docs |
Endpoints:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/auth/login/` | `{username, password}` | `{access, refresh}` | Django; throttle `auth_login` 5/min; called by the Next handler only |
| POST | `/api/auth/refresh/` | `{refresh}` | `{access, refresh}` | throttle `auth_refresh` 30/min; rotation blacklists the old refresh |
| POST | `/api/auth/logout/` | `{refresh}` | 204 | idempotent; throttle `auth_logout` 30/min |
| POST | `/api/auth/login` (Next) | `{username, password}` | 204 + cookies | same-origin; no tokens in the body |
| POST | `/api/auth/logout` (Next) | - | 204, cookies cleared | |
| any | `/api/<path>` (Next) | the browser's JSON request | Django's status and JSON body | bearer added server-side |

## O — Operations
Depends on phase 3a parts 05 and 07 (company scoping, error codes) and part 01 (the hosting variables); the backend host may still be undefined, since the handlers only need `API_INTERNAL_URL`.
1. Backend: dependency settings, `token_blacklist` migration, `CACHES`, rates, `INTERNAL_API_KEY`; throttle class and views; their tests.
2. Regenerate the client for the logout endpoint (`cd frontend && npm run generate:api`).
3. Frontend: the cookie helper; login, logout and proxy handlers; `proxy.ts`; `api-client.ts`; the login form and logout button.
4. Compose and `.env.example`; run the full flow in compose with Redis (login, expired access, refresh, logout, throttle across two workers).
5. Docs; delete gap #3 and the throttle part of #15; add gap #26.

## N — Norms
`architecture/quality.md` (secrets only from env, errors via spec 006), `frontend/docs/safeguards/auth-and-tokens.md` (the hardening target this spec implements), `conventions/naming.md`. Never log a token, a refresh body or the internal key.

## S — Safeguards
- **Secrets:** `INTERNAL_API_KEY` is a long random value in env only; rotating it needs both sides updated; startup fails without it in production.
- **XSS:** with HttpOnly cookies an injected script cannot read the tokens (it can still act as the user while the page is open; CSP and no unreviewed scripts remain the first defense).
- **CSRF:** `SameSite=Lax` plus the `Origin` check on every non-GET handler; mutations are never GET.
- **Throttle:** counters are per key and per scope; there is no lockout, so a legitimate user is never locked out by someone else's attempts (a rate-limited IP can still affect users behind one shared IP; accepted).
- **Proxy hygiene:** hop-by-hop and `Cookie` headers are not forwarded; only JSON content types; request size stays under the platform limit (large files use signed URLs later).
- **Failure modes:** Redis down → the cache raises. Login must stay available, so a cache error is logged and the request proceeds unthrottled (the rate limit is defense in depth, not the only control); confirmed by the user on 2026-10-05 (see Decisions). Django down → the handler answers 502 in the spec 006 shape.
- **Backward compatibility:** the Django auth endpoints keep their paths and bodies; only the browser's route changes. The old non-HttpOnly cookies are ignored and expire; users log in again once after the release.
- **Known limit:** the Django Admin login is outside this throttle (gap #26).

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/accounts/tests/test_auth_blacklist.py::test_rotated_refresh_token_cannot_be_reused`, `::test_blacklisted_refresh_is_rejected_with_token_not_valid`, `::test_the_rotated_refresh_token_still_works` |
| R2 | `apps/accounts/tests/test_auth_logout.py::test_logout_blacklists_the_refresh_token`, `::test_logout_is_idempotent`, `::test_logout_with_garbage_or_expired_token_is_204`, `::test_logout_without_a_refresh_field_is_a_400` |
| R3 | `apps/accounts/tests/test_auth_throttle.py::test_sixth_login_in_a_minute_is_429_with_throttled_code`, `::test_the_limit_also_stops_a_correct_password`, `::test_refresh_allows_30_per_minute`, `::test_logout_scope_is_separate_from_login` |
| R4 | `apps/core/tests/test_throttling.py::test_forwarded_ip_is_used_only_with_the_internal_key`, `::test_wrong_key_falls_back_to_remote_addr`, `::test_no_key_configured_ignores_the_forwarded_header`, `::test_comparison_is_constant_time`, `apps/core/tests/test_core_settings.py::test_internal_api_key_is_required_in_production`, `::test_internal_api_key_in_production_boots` |
| R5 | by hand, 2026-10-05: Django under gunicorn with 2 workers and the compose Redis; 1 login + 4 wrong ones were allowed and the 6th call answered 429 `throttled` whichever worker took it; another client address (through the trusted header) had its own counter; a forged address with the wrong key hit the same counter. Unit tests use a local-memory cache (`conftest.py::local_memory_cache`) |
| R6 | by hand through `next dev` against that Django: the login answered 204 without a body and set `access_token` (Max-Age 1800) and `refresh_token` (Max-Age 604800) as `HttpOnly; SameSite=lax` (`Secure` only in production); a request with the cookies reached Django through the proxy; the browser code reads no token (`grep` of `app/`, `lib/`, `components/`: token cookies appear only in `route.ts`, `proxy.ts`, `lib/auth-cookies.ts` and the server branch of `lib/api-client.ts`); plus `npx tsc --noEmit`, `npx eslint .`, `npm run build` |
| R7 | by hand (same setup): GET/POST through `/api/...` relayed status and JSON; only the refresh cookie (access missing) renewed transparently and set new cookies; five concurrent requests with the same old refresh cookie all answered 200 (shared refresh); a body that is not JSON answered 415 in the API's error shape; `/api/auth/refresh/` answered 404 |
| R8 | by hand: a POST with `Origin: http://evil.example` answered 403 `permission_denied`, the same POST with the own origin answered 201 |
| R9 | `grep`: no `NEXT_PUBLIC_API_URL` in `frontend/app`, `lib`, `components` (only docs of the old flow were rewritten, `render.yaml` is replaced in phase 3a part 01); `API_INTERNAL_URL` and `INTERNAL_API_KEY` are in `.env.example` and `docker-compose.yml`; the build runs with no `NEXT_PUBLIC_*` API variable |
| R10 | `apps/accounts/tests/test_auth_logout.py::test_old_refresh_fails_after_logout`; by hand: logout through the Next handler answered 204, cleared both cookies, and the same refresh token then answered 401 `token_not_valid` |
| R11 | gap: no automated test (the frontend has no test runner); `lib/auth-cookies.ts` is the one helper used by `proxy.ts` and the handler, enforced by TypeScript imports, and the by-hand run covers both |
| R12 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`npm run generate:api`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`)
- [x] `docs/architecture/quality.md`, `architecture/overview.md`, `apps/accounts.md`, frontend `docs/safeguards/auth-and-tokens.md` updated; gap #3 and the throttle part of #15 removed, gap #26 added in `docs/known-gaps.md`
- [x] Roadmap part 08 and the phase 3a table updated; index in `features/README.md` updated
