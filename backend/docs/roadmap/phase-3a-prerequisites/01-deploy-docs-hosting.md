---
summary: Plan and status of part 01 of phase 3a — Deploy docs for the new hosting.
read-when: you work on deploy docs for the new hosting before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 01 — Deploy docs for the new hosting

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** - · **Frontend impact:** none · **Depends on:** -
**Spec:** none (docs and config only)

## Goal
Align the docs and the deploy config with the new hosting (the deploy moved to Supabase on 2026-10-05) before anything else changes the database.

## Scope
- [x] Confirm where the Django backend, the Next.js frontend, Redis and the Celery worker run now: all in one Docker Compose stack on a VPS (decided and deployed on 2026-10-08)
- [x] Replace or retire `render.yaml` and update `.github/workflows/ci.yml` if it deploys (`render.yaml` deleted on 2026-10-19; CI does not deploy)
- [x] Update `architecture/operations.md` (environments, deploy flow, runbook) and `architecture/overview.md` (env vars, stack)
- [x] Update the gaps that mention the old host (#19 now says the ERP database has no backup yet; #7, #15 and #18 no longer name a host)
- [x] Update the root `README.md` quick start if it changed (a *Deploy na VPS* section was added; the Render section was removed on 2026-10-19)
- [x] Give the frontend `API_INTERNAL_URL` and `INTERNAL_API_KEY`, and the backend `INTERNAL_API_KEY` and a reachable `REDIS_URL` (the login rate limit lives in Redis)
- [x] Create the production database from scratch (Postgres 16 container) and run `migrate` (done by `entrypoint.sh` on the first start)

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

## Decision of 2026-10-08 (user)
The plan of 2026-10-05 (Vercel, Supabase, managed Redis) is replaced: everything runs on **one VPS** in Docker Compose, behind the Caddy of a project that already runs there, with the temporary HTTPS name `erp.177-7-63-175.sslip.io`. Receipts go to Cloudflare R2. The `render.yaml` Blueprint is no longer used. Details in `architecture/operations.md` → *Production on the VPS*.

## Result
Deployed and answering over HTTPS on 2026-10-08.
**Left:** retire `render.yaml` and the Render section of the root `README.md` (kept for now; ask before deleting), decide whether `ci.yml` should deploy, and version the VPS compose and `deploy.sh` in the repository.
Closed on 2026-10-19 (user): `render.yaml` and the Render section of the root `README.md` deleted; the VPS `docker-compose.yml`, `deploy.sh` and `deploy.env` versioned in `deploy/vps/` (copied read-only from the VPS, no secret); CI does not deploy for now (a push-to-deploy workflow was set aside).
