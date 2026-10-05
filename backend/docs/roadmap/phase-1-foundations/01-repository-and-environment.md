---
summary: Plan and status of part 01 of phase 1 — Repository and local environment.
read-when: you work on repository and local environment or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-1-foundations/README.md; you need the process → roadmap/README.md
---
# Part 01 — Repository and local environment

**Status:** done · **Phase:** 1 (Foundations) · **Apps:** - · **Frontend impact:** none · **Depends on:** -
**Spec:** none yet

## Goal
Monorepo with `backend/` and `frontend/` and a one-command local environment.

## Scope
- [x] Create the repository and folder structure (Django backend + Next.js frontend)
- [x] Configure Docker Compose (Postgres, Redis, backend, Celery, frontend)

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None.

## Result
`docker-compose.yml` at the repository root; see `architecture/operations.md`.
