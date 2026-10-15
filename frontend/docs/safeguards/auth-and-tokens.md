---
summary: HttpOnly-cookie auth through the Next API proxy: who holds the tokens, the flow of login, requests, renewal and logout, and its limits.
read-when: you touch login, logout, tokens, cookies, proxy.ts or the /api route handler
skip-if: headers/CSP → safeguards/http-hardening.md; general secure coding → safeguards/secure-coding.md; the backend side (blacklist, throttle) → backend/docs/features/history.md (section 007)
---
# Authentication and token storage (S — Safeguards)

The browser never sees a token. The Next server holds them in `HttpOnly` cookies and talks to Django (spec 007).

## The flow
| Step | Where | Behavior |
|---|---|---|
| Login | `LoginForm` → `POST /api/auth/login/` (same origin) | `app/api/[...path]/route.ts` posts to Django, then sets the cookies and answers `204` (no token in the body) |
| Cookies | `lib/auth-cookies.ts` | `access_token` (Max-Age 30 min = the JWT life) and `refresh_token` (7 days): `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`; written only on the server |
| API calls | browser → `/api/...` (same origin) → handler → Django | the handler reads the cookie, adds `Authorization: Bearer`, relays status and JSON unchanged; the browser never calls Django |
| SSR | `lib/api-client.ts` (server branch) | Server Components read the cookie with `next/headers` and call Django directly |
| Renewal | handler (API calls) and `proxy.ts` (page loads) | access missing/expiring (< 30 s) or refused with 401 → one refresh with the refresh cookie, new cookies on the response; a failed refresh clears the cookies (API: `401`, page: redirect to `/login`) |
| Logout | `LogoutButton` → `POST /api/auth/logout/` | the handler sends the refresh token to Django (`POST /api/auth/logout/`, which blacklists it) and clears both cookies |
| Browser 401 | `lib/api-client.ts` | the handler already tried to renew: the session ended → hard navigation to `/login` (`/api/auth/*` is excluded: 401 there is bad credentials) |
| `?next=` | `LoginForm` | `safeNextPath()` (internal paths only) |

`/api/auth/refresh/` is **not** reachable from the browser (the handler answers 404): renewal is internal.

## What the handler guarantees
- **Only `/api/...` routes.** Every URL segment must match `[A-Za-z0-9_-]+` (`lib/api-path.ts`, tested in `tests/api-path.test.mjs`); anything else answers `404` before Django is called. Next decodes segments, so `/api/..%2fadmin/login/` would otherwise become `/admin/login/` on Django (the Admin was reachable through the proxy until this check).
- **JSON only.** A body that is not JSON answers `415`; files (receipts, boleto PDFs) will not go through it (the platform caps request bodies near 4.5 MB): they will use signed bucket URLs.
- **No browser state forwarded.** The `Cookie` header is not sent to Django; only the content type comes back.
- **CSRF.** Besides `SameSite=Lax`, a non-GET whose `Origin` is not this server's own origin answers `403` (own origin = `x-forwarded-host`/`host` + `x-forwarded-proto`).
- **Real client address for the rate limit.** Django only sees this server, so the handler (and `proxy.ts`) send `X-Forwarded-For` (the client address from the platform) plus `X-Internal-Key` (`INTERNAL_API_KEY`); Django trusts the address only when the key matches.
- **One refresh at a time.** The refresh token rotates and the old one is revoked, but the screen fires several requests with the same expired cookie; `lib/backend.ts` shares one in-flight refresh per token and keeps its result for 30 s, so the late ones do not log the user out.
- **Errors in the API's own shape** (`{errors: [{field, code, message}]}`): `401` session ended, `403` blocked origin, `404`, `415`, `502` (`bad_gateway`, Django unreachable).

## Where a token may live
Only in the `HttpOnly` cookies and in server memory for the length of one request. `localStorage`/`sessionStorage`, React state/query cache, URL, logs, toasts and error text: **never**. `lib/cookies.ts` is for preference cookies only (sidebar, appearance), never tokens.

## Known limits
| Item | Risk / note |
|---|---|
| XSS can still act as the user while the page is open | it cannot steal the tokens; CSP and no unreviewed scripts remain the first defense |
| The shared refresh result lives in the memory of one server instance | with several instances (serverless) a race between instances can still log a user out; rare, accepted |
| `Secure` is off outside production | local `http://localhost` works; production must be HTTPS |
| `x-forwarded-for` comes from the platform in front of Next | on a platform that does not set it, the rate limit sees the Next server's address (all users share it) |

## Environment
`API_INTERNAL_URL` (the Django address, **server only**, never `NEXT_PUBLIC_*`) and `INTERNAL_API_KEY` (same value as the backend).

## Code rules
Cookie names from `lib/auth.ts` (`ACCESS_COOKIE`, `REFRESH_COOKIE`), never literals. Read/write token cookies only in `lib/auth-cookies.ts`, `app/api/[...path]/route.ts`, `proxy.ts` and the server branch of `lib/api-client.ts`. Never log, pass as props, or send a token to a third party. Authorization is the backend's job.
