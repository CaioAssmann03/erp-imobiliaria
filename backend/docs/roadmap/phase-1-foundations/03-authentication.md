---
summary: Plan and status of part 03 of phase 1 — Authentication.
read-when: you work on authentication or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-1-foundations/README.md; you need the process → roadmap/README.md
---
# Part 03 — Authentication

**Status:** done · **Phase:** 1 (Foundations) · **Apps:** accounts · **Frontend impact:** new screens · **Depends on:** 02
**Spec:** none yet

## Goal
Username + password login with JWT; no granular roles yet.

## Scope
- [x] Custom `User` model
- [x] JWT login (access + refresh) endpoints
- [x] Login screen

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None.

## Result
See `apps/accounts.md`. Authorization is still only `IsAuthenticated` (`known-gaps.md` #2).
