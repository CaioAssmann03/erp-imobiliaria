---
read-when: you handle user input, URLs, redirects, secrets, personal data or third-party calls
size: small
---
# Secure coding (S — Safeguards)

- **Secrets:** only `NEXT_PUBLIC_*` reaches the browser; never put keys/passwords/tokens there. Do not commit `.env`.
- **Authorization:** the frontend never authorizes (hiding UI protects nothing); the backend checks every request. Do not trust
  query strings, cookies or hidden fields. A 403 shows "Você não tem permissão para esta ação.".
- **XSS/injection:** render data as JSX text; **never** `dangerouslySetInnerHTML` with API/user content; no `eval`/`new Function`/
  `document.write`; `encodeURIComponent` for hand-built query parts (the generated client encodes params); validate `href`/`src`
  (`https:` or relative; never `javascript:`).
- **Redirects/links:** `?next=` through `safeNextPath()` (`lib/safe-redirect.ts`); `target="_blank"` needs `rel="noopener noreferrer"`.
- **PII (CPF, CNPJ, email, phone — LGPD):** never in `console.log`, toasts, error texts, analytics or URLs; show only what the screen
  needs; not in browser storage (query cache for the session; `queryClient.clear()` on logout).
- **Validation:** Zod for UX **and** always handle the server 400 (`applyServerErrors`); normalize in `xxxToPayload`; mirror backend `max_length`.
- **Requests:** only the generated client carries the token. Third parties (ViaCEP in `use-cep-lookup`) are anonymous, read-only and receive only
  the CEP; treat their responses as untrusted and map only needed fields.
- **Dependencies:** add only when needed; keep `npm audit` free of high/critical; review lockfile changes; no third-party scripts without
  review and a CSP update.
- **Errors:** short Portuguese messages; never stack traces or server internals.

Review: no secret in `NEXT_PUBLIC_*` · no token/PII in storage/logs/props/toasts · no `dangerouslySetInnerHTML` · links/redirects validated ·
server errors handled · no authorization on the client.
