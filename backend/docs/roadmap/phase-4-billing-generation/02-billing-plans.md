---
summary: Plan and status of part 02 of phase 4 — Billing plans.
read-when: you work on billing plans or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 02 — Billing plans

**Status:** todo · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** phase 3
**Spec:** none yet

## Goal
Reusable mold of the monthly issuance per condominium.

## Scope
- [ ] Models + API: `BillingPlan`, `BillingPlanItem`
- [ ] Admin

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| PlanoCobranca | `BillingPlan` | per condominium, named |
| ItemPlanoCobranca | `BillingPlanItem` | description, cost center, calculation kind (fixed / ideal-fraction share / per-unit registered value), default value |

### Business rules
- Calculation kinds: fixed value, share by one of the six ideal fractions (`ideal_fraction` … `ideal_fraction_6`: the item names its number, [spec 020](../../features/history.md)), value registered per unit (gas, water, energy on `Unit`).

### Open questions
(none)

## Result
Not started.
