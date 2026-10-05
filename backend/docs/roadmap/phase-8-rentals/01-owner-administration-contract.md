---
summary: Plan and status of part 01 of phase 8 — Owner administration contract.
read-when: you work on owner administration contract or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-8-rentals/README.md; you need the process → roadmap/README.md
---
# Part 01 — Owner administration contract

**Status:** todo · **Phase:** 8 (Rentals) · **Apps:** rentals · **Frontend impact:** client regeneration · **Depends on:** phase 3
**Spec:** none yet

## Goal
Contract between the company and a property owner authorizing administration/rental.

## Scope
- [ ] Model + API: owner administration contract (fee, intermediation fee, guarantee, procurator, invoice/DIMOB flags)

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| ContratoAdministracao (locação) | `OwnerAdministrationContract` | not the same as `condominiums.AdministrationContract`; name must avoid the clash |

### Business rules
- None.

### Open questions
- [ ] Final model name and app? (recommended: `OwnerAdministrationContract` in the rentals app, to avoid clashing with the condominium contract)

## Result
Not started.
