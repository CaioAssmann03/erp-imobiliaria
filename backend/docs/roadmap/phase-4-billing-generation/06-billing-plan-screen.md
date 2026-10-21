---
summary: Plan and status of part 06 of phase 4 — Billing plan screen.
read-when: you work on billing plan screen or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 06 — Billing plan screen

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 02
**Spec:** [028 — Billing plan screen](../../features/history.md) (section 028)

## Goal
Configure the billing plan per condominium in the UI.

## Scope
- [x] Screen: billing plan form with items and target cost centers
- [x] The issuance fields on the condominium and unit forms (added by the spec)

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-21 (spec 028): **Cobrança → Planos de cobrança** (list, create, edit, delete) with the items editor, plus `issuance_day`, `exempts_manager_unit` and `billing_recipient` on the existing forms. Not exercised in a browser yet (manual run pending). The documents and runs screens are part 07.
