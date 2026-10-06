---
summary: Plan and status of part 01 of phase 3a — Deploy docs for the new hosting.
read-when: you work on deploy docs for the new hosting before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 01 — Deploy docs for the new hosting

**Status:** todo · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** - · **Frontend impact:** none · **Depends on:** -
**Spec:** none (docs and config only)

## Goal
Align the docs and the deploy config with the new hosting (the deploy moved to Supabase on 2026-10-05) before anything else changes the database.

## Scope
- [ ] Confirm where the Django backend, the Next.js frontend (Vercel), Redis (managed) and (later) the Celery worker run now
- [ ] Replace or retire `render.yaml` and update `.github/workflows/ci.yml` if it deploys
- [ ] Update `architecture/operations.md` (environments, deploy flow, runbook) and `architecture/overview.md` (env vars, stack)
- [ ] Update the gaps that mention the old host: #7, #15, #18, #19 in `known-gaps.md`
- [ ] Update the root `README.md` quick start if it changed
- [ ] Give the new frontend host `API_INTERNAL_URL` and `INTERNAL_API_KEY` (the browser no longer uses `NEXT_PUBLIC_API_URL`), and the backend host `INTERNAL_API_KEY` and a reachable `REDIS_URL` (the login rate limit lives in Redis)
- [ ] Create the staging/production database from scratch on the new hosting (migrations were reset in part 02; no data to carry over) and run `migrate`

## Draft for the spec
Seed material from the known-gaps review of 2026-10-05. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Supabase hosts Postgres, Storage and Edge Functions; a Django container and a Next.js app need a container/Node host. Do not write the new topology until the backend host is chosen (the frontend, Redis and database answers are recorded below).

### Decisions (user, 2026-10-05)
- The **frontend runs on Vercel**.
- **Redis is a managed service** (Upstash or similar; provider to confirm). It serves the login throttle (part 08) and Celery (phases 4 and 5).
- The app connects to the Supabase Postgres through the **pooler**; `migrate` runs through the **direct connection**. Transaction-mode pooling needs `DISABLE_SERVER_SIDE_CURSORS = True` and `CONN_MAX_AGE = 0`; `pg_trgm` must be enabled in the Supabase project.

### Open questions
- [ ] Where does the Django backend run? The user answered "not defined yet". Supabase hosts Postgres, Storage and Edge Functions; a Django container needs a container host. (recommended: a container platform with a Dockerfile deploy, e.g. Fly.io or Railway, in a region close to the Supabase one)
- [ ] Redis provider and its connection string format (`rediss://` with TLS)? (recommended: Upstash, because it is serverless and has a free tier; confirm before writing the env var docs)

## Result
Not started.
