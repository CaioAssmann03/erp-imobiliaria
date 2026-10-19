---
summary: Plan and status of part 02 of phase 4 — Billing plans.
read-when: you work on billing plans or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 02 — Billing plans

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** phase 3
**Spec:** [024 — Billing plans](../../features/history.md) (section 024)

## Goal
Reusable mold of the monthly issuance per condominium.

## Scope
- [x] Models + API: `BillingPlan`, `BillingPlanItem`
- [x] Admin

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-19 (spec 024): new app `billing` with `BillingPlan` and `BillingPlanItem`, `/api/billing-plans/` with nested items, Admin, audit, client regenerated. Several plans per condominium are joined into one boleto per unit by the issuance (part 04), which also does the rounding and checks the fractions. The screen is part 06.
