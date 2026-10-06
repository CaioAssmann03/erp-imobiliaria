---
summary: Plan and status of part 07 of phase 3 — Accounts payable screens.
read-when: you work on accounts payable screens or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 07 — Accounts payable screens

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 05
**Spec:** [016 — Finance screens](../../features/history.md) (section 016)

## Goal
The staff register, list and settle accounts payable in the Next frontend, after settling creates its ledger entry.

## Scope
- [x] Screen: list and filter accounts payable (status, supplier, condominium, due date)
- [x] Screen: register and edit an account payable (supplier, condominium or company expense, cost center, amounts, dates)
- [x] Action: settle ("baixa": date, amount paid, method) and cancel
- Moved out: the receipt upload control → part 06 (it needs the storage and the hosting first)

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-06 (spec 016). `/finance/accounts-payable` (list with search and filters, register, edit, settle and cancel; a closed account opens read-only), under a new **Financeiro** navigation group. `tsc`, `eslint` and `next build` are clean; the screens were not exercised in a browser in this change.
