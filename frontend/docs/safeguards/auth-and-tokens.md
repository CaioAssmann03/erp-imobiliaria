---
read-when: you touch login, logout, tokens, cookies or proxy.ts; or evaluate auth risk
size: medium
---
# Authentication and token storage (S — Safeguards)

## Current implementation
| Piece | Where | Behavior |
|---|---|---|
| Login | `POST /api/auth/login/` | `access` (30 min) + `refresh` (7 days, rotating) |
| Storage | cookies `access_token`, `refresh_token` | written by `lib/cookies.ts` (`document.cookie`) at login and by `proxy.ts` on refresh; `path=/`, `SameSite=Lax` |
| Protection | `proxy.ts` | no token → `/login?next=`; expiring (< 30 s) → refresh before render; refresh fails → clear + `/login` |
| Sending | `lib/api-client.ts` | `Authorization: Bearer` (cookie in browser, `next/headers` on server) |
| Browser refresh | `lib/api-client.ts` | 401 → one shared refresh + retry; failure → clear + hard navigate to `/login` |
| Logout | `LogoutButton` | removes cookies, `queryClient.clear()`, `/login` |
| `?next=` | `LoginForm` | `safeNextPath()` (internal paths only) |

`/api/auth/*` is excluded from refresh/redirect logic (401 = invalid credentials).

## Where a token may live
Cookie: yes (current; the server needs it for first paint and refresh). `localStorage`/`sessionStorage`: **never** (any script reads it, server cannot).
React state/query cache, URL, logs, toasts, error text: never.

## Known limits (today)
| Item | Risk |
|---|---|
| cookies not `HttpOnly` (JS reads/writes them) | an XSS can steal tokens |
| cookies not `Secure` | tokens could cross plain HTTP |
| access cookie lives 1 day, JWT 30 min | harmless but misleading |
| logout only clears cookies | refresh token valid on the server until expiry (no blacklist) |

## Hardening target (not implemented): `HttpOnly; Secure; SameSite=Lax` cookies JS cannot read
1. Server-issued cookies: a Next Route Handler/Server Action does login against Django and sets them with
   `cookies().set(name, value, { httpOnly: true, secure: production, sameSite: "lax", path: "/", maxAge })`; `LoginForm` posts to it.
2. The browser can no longer send `Authorization`: route API calls through a Next proxy (Route Handler or `rewrites` + handler) that reads the
   cookie on the server and forwards to Django with `Bearer`; `lib/api-client.ts` loses its cookie read and in-browser refresh.
3. Keep refreshing in `proxy.ts` with the same flags. 4. Real logout: handler clears cookies and **blacklists the refresh token**
   (enable `rest_framework_simplejwt.token_blacklist`). 5. CSRF: keep `SameSite=Lax`, mutate only with POST/PATCH/DELETE, check `Origin` in handlers.

Until then treat XSS as the main risk (no `dangerouslySetInnerHTML`, strict CSP, no unreviewed third-party scripts).

## Code rules
Cookie names from `lib/auth.ts` (`ACCESS_COOKIE`, `REFRESH_COOKIE`), never literals. Read/write tokens only in `lib/cookies.ts`, `lib/api-client.ts`,
`proxy.ts`, login and logout. Never log, pass as props, or send a token to a third party. Authorization is the backend's job.
