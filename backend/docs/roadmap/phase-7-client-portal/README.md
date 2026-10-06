---
summary: Phase 7 (Client portal) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 7: client portal
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 7 — Client portal

**Status:** todo · **Source:** Sprint 7 of the sprints PDF · **Depends on:** phase 6

## Goal
Separate login for owner, tenant and syndic with statement, boleto copy and common-area reservations.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Portal authentication and permissions](01-portal-auth-and-permissions.md) | todo | accounts, condominiums |
| 02 | [Unit statement and boleto copy](02-statements-and-boleto-copy.md) | todo | billing, finance, frontend |
| 03 | [Common-area reservations](03-common-area-reservations.md) | todo | condominiums, frontend |

## Notes
Needs object-level permissions and company scoping (`known-gaps.md` #2) before any customer data is exposed.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
