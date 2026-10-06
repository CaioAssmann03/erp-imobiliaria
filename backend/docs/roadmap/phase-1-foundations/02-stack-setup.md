---
summary: Plan and status of part 02 of phase 1 — Backend and frontend stack setup.
read-when: you work on backend and frontend stack setup or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-1-foundations/README.md; you need the process → roadmap/README.md
---
# Part 02 — Backend and frontend stack setup

**Status:** done · **Phase:** 1 (Foundations) · **Apps:** core · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
Both applications boot and talk through a generated OpenAPI contract.

## Scope
- [x] Configure Django + DRF + drf-spectacular
- [x] Configure Next.js + TypeScript + Tailwind + TanStack Query + generated API client

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None.

## Result
The OpenAPI schema is the contract; the client is regenerated with `npm run generate:api` (see root `AGENTS.md`).
