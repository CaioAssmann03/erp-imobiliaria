---
summary: Plan and status of part 02 of phase 2 — Unit, person and link endpoints.
read-when: you work on unit, person and link endpoints or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-2-condominium-registry/README.md; you need the process → roadmap/README.md
---
# Part 02 — Unit, person and link endpoints

**Status:** done · **Phase:** 2 (Condominium registry) · **Apps:** condominiums, persons · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
CRUD for `Unit`, `Person` and the owner/tenant links (`UnitPerson`).

## Scope
- [x] Endpoints: Unit
- [x] Endpoints: Person
- [x] Endpoints: UnitPerson (links)

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None.

## Result
Sum caps (ownership percentages, ideal fraction) are enforced in the models; see `architecture/data.md`.
