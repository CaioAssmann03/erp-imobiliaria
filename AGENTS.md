# ERP Imobiliária — repository index

Monorepo for a condominium administration ERP (EVE Administradora de Imóveis).

| Part | Stack | Start here |
|---|---|---|
| `backend/` | Django + DRF + PostgreSQL + Celery | [`backend/AGENTS.md`](backend/AGENTS.md) |
| `frontend/` | Next.js (App Router) + TanStack Query | [`frontend/AGENTS.md`](frontend/AGENTS.md) |

## How to work

1. **Do not explore the repository on your own.** Open the `AGENTS.md` of the part you are changing and follow its docs index.
2. Task touches only one part → read only that part's `AGENTS.md`. Task touches both (an API change that reaches the UI) → read both, backend first.
3. Any doubt or gap: **ask the user**. What is done and what comes next is in `backend/docs/roadmap/`; features start with a spec in `backend/docs/features/` (see the backend index); UI-only work follows `frontend/docs/`.

## Header-first reading (saves context)

Every doc in `backend/docs/` and `frontend/docs/` starts with a 5-line header:

```
---
summary: what the file contains (one line)
read-when: situations that need it
skip-if: other situation → path of the right file; ...
---
```

1. To decide whether to open a doc, read **only its first 6 lines** (for example the Read tool with `limit: 6`).
2. If the summary is not what you need, or a `skip-if` case matches, **stop and go to the file it points to**; do not read the rest.
3. Read the whole file only when `read-when` matches. Prefer the routing table in `docs/README.md` to find files; do not scan folders.
4. When you create or change a doc, write or update its header (summary ≤ 1 line, 1–3 `skip-if` redirects, paths relative to that `docs/` root).

## Cross-stack rules

- **The OpenAPI schema is the contract.** After any API change (field, enum, endpoint, filter), the frontend client must be regenerated
  (`cd frontend && pnpm generate:api`, backend running) and its callers fixed.
- Names are English on both sides and identical to the API field names; only user-facing text is Portuguese (frontend).
- Never commit secrets or personal data; `.env` stays local (`.env.example` has placeholders).
- Docs and `AGENTS.md` files are English; update the doc you changed in the same change.

## Repository files

| File | Purpose |
|---|---|
| `docker-compose.yml` | local environment (db, redis, backend, celery, frontend) |
| `.github/workflows/ci.yml` | CI (backend and frontend jobs) |
| `README.md` | human-oriented overview and quick start |
