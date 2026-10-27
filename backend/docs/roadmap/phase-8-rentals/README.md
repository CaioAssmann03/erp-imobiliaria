---
summary: Phase 8 (Rentals) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 8: rentals
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 8 — Rentals

**Status:** todo · **Source:** Sprint 8 of the sprints PDF · **Depends on:** phase 7

## Goal
Property rentals reusing the current account, batches and billing already built; only the holder changes.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Owner administration contract](01-owner-administration-contract.md) | todo | rentals |
| 02 | [Properties and co-owners](02-properties.md) | todo | rentals |
| 03 | [Rental contracts and screens](03-rental-contracts.md) | todo | rentals, frontend |
| 04 | [Owner payouts](04-owner-payouts.md) | todo | rentals, finance |
| 05 | [Property to unit/condominium link](05-property-condominium-link.md) | todo | rentals, condominiums |

## Notes
Rental data already partly exists as `UnitPerson` with role `tenant`; the data model PDF introduces `Property` and `RentalContract` as new entities instead.

**People and IDs** ([spec 019](../../features/history.md), [038](../../features/history.md)): rental people are the same `Person` records, released to Rentals by a `PersonModuleMembership` row with the key `rentals` (the module is already registered). The Rentals lists and pickers send `module=rentals`, the rental models refuse a person who has no such row, `Property` gets a `code` from its own sequence with the spec's helper, and owners and tenants are identified by the person's `code`.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
