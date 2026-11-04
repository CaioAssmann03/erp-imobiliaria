---
summary: Rules for secrets, authorization trust, XSS, redirects, PII, validation, dependencies, and the recommended (not yet implemented) HTTP headers and CSP.
read-when: you handle input, URLs, redirects, PII or third-party calls, or you touch next.config headers or CSP
skip-if: token/cookie flow and the /api proxy → quality/auth-and-tokens.md
---
# Secure coding and HTTP hardening

- **Secrets:** only `NEXT_PUBLIC_*` reaches the browser; never put keys/passwords/tokens there. Do not commit `.env`.
- **Authorization:** the frontend never authorizes (hiding UI protects nothing); the backend checks every request. Do not trust
  query strings, cookies or hidden fields. A 403 shows "Você não tem permissão para esta ação.".
- **XSS/injection:** render data as JSX text; **never** `dangerouslySetInnerHTML` with API/user content; no `eval`/`new Function`/
  `document.write`; `encodeURIComponent` for hand-built query parts (the generated client encodes params); validate `href`/`src`
  (`https:` or relative; never `javascript:`).
- **Redirects/links:** `?next=` through `safeNextPath()` (`lib/auth/safe-redirect.ts`); `target="_blank"` needs `rel="noopener noreferrer"`.
- **PII (CPF, CNPJ, email, phone — LGPD):** never in `console.log`, toasts, error texts, analytics or URLs; show only what the screen
  needs; not in browser storage (query cache for the session; `queryClient.clear()` on logout).
- **Validation:** Zod for UX **and** always handle the server 400 (`applyServerErrors`); normalize in `xxxToPayload`; mirror backend `max_length`.
- **Requests:** only the generated client carries the token. Third parties (ViaCEP in `use-cep-lookup`) are anonymous, read-only and receive only
  the CEP; treat their responses as untrusted and map only needed fields.
- **Dependencies:** add only when needed; keep `pnpm audit` free of high/critical; review lockfile changes; a dependency runs install scripts only when listed in `allowBuilds` of `pnpm-workspace.yaml` (today `esbuild`, `unrs-resolver`); no third-party scripts without
  review and a CSP update.
- **Errors:** short Portuguese messages; never stack traces or server internals.

Review: no secret in `NEXT_PUBLIC_*` · no token/PII in storage/logs/props/toasts · no `dangerouslySetInnerHTML` · links/redirects validated ·
server errors handled · no authorization on the client.

## HTTP hardening (recommended, not implemented)

Test each change with the real app (API, ViaCEP, fonts, charts).

- **Headers** (`next.config.ts`, `async headers()` on `/(.*)`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains` in production over HTTPS, and `poweredByHeader: false`.
- **CSP**: prefer a nonce-based policy built in `proxy.ts` (Next CSP guide in `node_modules/next/dist/docs/`). Starting point:
  ```
  default-src 'self'; script-src 'self' 'nonce-<nonce>' 'strict-dynamic'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://viacep.com.br;
  frame-src https://www.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  ```
  `connect-src 'self'` covers the API (the browser only calls its own origin; Django is reached by the Next server); ViaCEP runs in the browser; `frame-src` is for the address map; fonts are self-hosted. When receipts are enabled, add the bucket origin (`https://<account id>.r2.cloudflarestorage.com`) to `connect-src`. Roll out with `Content-Security-Policy-Report-Only`, fix violations, then enforce.
- **Cookies**: tokens are `HttpOnly` + `Secure` (prod) + `SameSite=Lax` (implemented, see `quality/auth-and-tokens.md`); preference cookies (`ui_*`) are non-sensitive and may stay JS-readable.
- **CORS** is the backend's job; the browser talks only to the frontend origin. HTTPS everywhere in production (redirect at the edge); do not expose source maps publicly unless needed for error tracking.
