---
summary: Plan and status of part 04 of phase 1 — Company and core registry models.
read-when: you work on company and core registry models or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-1-foundations/README.md; you need the process → roadmap/README.md
---
# Part 04 — Company and core registry models

**Status:** done · **Phase:** 1 (Foundations) · **Apps:** core, persons, condominiums · **Frontend impact:** none · **Depends on:** 03
**Spec:** none yet

## Goal
Multi-company from day one and the registry entities every module reuses.

## Scope
- [x] `Company` (multi-company base)
- [x] `Person` (+ individual / legal), `Condominium`, `Block`, `Unit`, `UnitPerson`

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| Empresa | `Company` | multi-company base |
| Pessoa | `Person` | + `PeopleIndividual` / `PeopleLegal` |
| UnidadeParte | `UnitPerson` | owner / tenant link |

### Business rules
- None.

### Open questions
- None.

## Result
See `apps/core.md`, `apps/persons.md`, `apps/condominiums.md` and `architecture/data.md`.
