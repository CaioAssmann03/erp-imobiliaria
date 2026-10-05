---
summary: Plan and status of part 03 of phase 8 — Rental contracts and screens.
read-when: you work on rental contracts and screens or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-8-rentals/README.md; you need the process → roadmap/README.md
---
# Part 03 — Rental contracts and screens

**Status:** todo · **Phase:** 8 (Rentals) · **Apps:** rentals, frontend · **Frontend impact:** new screens · **Depends on:** 02
**Spec:** none yet

## Goal
Rental contract with principal and additional tenants, readjustment and guarantee.

## Scope
- [ ] Model + API: `RentalContract`
- [ ] Screen: property registry and rental contract

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| ContratoLocacao | `RentalContract` | property, landlord, principal tenant, additional tenants, dates, rent values, readjustment, discount/fine, guaranteed months, status active/closed/defaulting |

### Business rules
- None.

### Open questions
- [ ] Optional move-out process and inspection (`Inspection` per room) in this phase? (recommended: backlog; keep the contract only)

## Result
Not started.
