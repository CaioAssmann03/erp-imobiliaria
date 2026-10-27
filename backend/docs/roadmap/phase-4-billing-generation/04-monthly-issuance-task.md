---
summary: Plan and status of part 04 of phase 4 — Monthly issuance task.
read-when: you work on monthly issuance task or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 04 — Monthly issuance task

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 02, 03
**Spec:** [026 — Monthly issuance](../../features/history.md) (section 026)

## Goal
Run a plan for a month: one document + items per unit.

## Scope
- [x] Celery task: monthly calculation (fixed, ideal-fraction share or the unit's registered value)
- [x] Beat schedule with a configurable day per condominium (`CondominiumBillingRules.issuance_day`)
- [x] Idempotency: running twice for the same month creates no duplicates

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-21 (spec 026): `issue_condominium_billing` service, `BillingRun` audit (`/api/billing-runs/`, also the manual trigger), daily beat task at 06:00, `Unit.billing_recipient`, `CondominiumBillingRules.issuance_day` and `exempts_manager_unit`, payer choice and share rounding in the models, client regenerated. National holidays and `credit_limit` are recorded in `known-gaps.md`.
