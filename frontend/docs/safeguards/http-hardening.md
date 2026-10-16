---
summary: Security headers, CSP, cookie flags and CORS (recommended, not implemented).
read-when: you touch next.config headers, CSP or cookie flags
skip-if: token storage design → safeguards/auth-and-tokens.md
---
# HTTP hardening (S — Safeguards)

Status: **recommended, not implemented** unless stated. Test each change with the real app (API, ViaCEP, fonts, charts).

**Headers** (`next.config.ts`, `async headers()` on `/(.*)`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and in production over HTTPS
`Strict-Transport-Security: max-age=63072000; includeSubDomains`. Also `poweredByHeader: false`.

**CSP** (limits XSS damage; tokens are JS-readable today). Prefer a nonce-based policy built in `proxy.ts` (see the Next CSP guide in
`node_modules/next/dist/docs/`). Starting point:
```
default-src 'self'; script-src 'self' 'nonce-<nonce>' 'strict-dynamic'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <API origin> https://viacep.com.br;
frame-src https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```
When receipts are enabled, add the bucket origin (`https://<account id>.r2.cloudflarestorage.com`) to `connect-src`: the browser `PUT`s the file straight to it. `connect-src 'self'` is enough for the API (the browser only calls its own origin, `/api/...`; Django is reached by the Next server); add `https://viacep.com.br` (CEP lookup runs in the browser). `frame-src https://www.google.com` is for the address map (spec 021, an iframe of the Maps Embed API). Fonts are
self-hosted (`next/font`). Roll out with `Content-Security-Policy-Report-Only`, fix violations, then enforce.

**Cookies:** tokens → `HttpOnly` + `Secure` (prod) + `SameSite=Lax` + `Path=/` + `Max-Age` = token life (implemented: safeguards/auth-and-tokens.md). Preference cookies (`ui_*`, sidebar) are non-sensitive and may stay JS-readable.

**CORS:** backend's job (`CORS_ALLOWED_ORIGINS` = frontend URL). If API calls go through a Next proxy, the browser talks only to the frontend origin.
**Other:** HTTPS everywhere in production (redirect at the edge); do not expose source maps publicly unless needed for error tracking.
