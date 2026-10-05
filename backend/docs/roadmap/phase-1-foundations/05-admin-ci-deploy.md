---
summary: Plan and status of part 05 of phase 1 — Backoffice, CI and first deploy.
read-when: you work on backoffice, ci and first deploy or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-1-foundations/README.md; you need the process → roadmap/README.md
---
# Part 05 — Backoffice, CI and first deploy

**Status:** done · **Phase:** 1 (Foundations) · **Apps:** all · **Frontend impact:** none · **Depends on:** 04
**Spec:** none yet

## Goal
Backoffice for the bureaucratic registries, automated tests on every push, and a running staging environment.

## Scope
- [x] Django Admin (django-unfold) configured for the models
- [x] GitHub Actions CI running pytest
- [x] Initial deploy on Render (`render.yaml`)

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None.

## Result
`.github/workflows/ci.yml`, `render.yaml`. Deploy confirmed done by the user on 2026-10-05; runbook in `architecture/operations.md`.
