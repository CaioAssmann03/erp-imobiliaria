---
summary: Plan and status of part 04 of phase 8 — Owner payouts.
read-when: you work on owner payouts or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-8-rentals/README.md; you need the process → roadmap/README.md
---
# Part 04 — Owner payouts

**Status:** todo · **Phase:** 8 (Rentals) · **Apps:** rentals, finance · **Frontend impact:** client regeneration · **Depends on:** 03
**Spec:** none yet

## Goal
Monthly payout of the received rent to the owner, minus the company fee and maintenance.

## Scope
- [ ] Model + API: `OwnerPayout`, reusing `CurrentAccount` with a rental-contract holder
- [ ] Maintenance costs charged to the owner flow through accounts payable

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| RepasseProprietario | `OwnerPayout` | received rent, administration fee kept, discounts, net amount, payout date, status pending/paid_out |

### Business rules
- None.

### Open questions
- None.

## Result
Not started.
