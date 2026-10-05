---
summary: Plan and status of part 03 of phase 3 — Accounts payable.
read-when: you work on accounts payable or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 03 — Accounts payable

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** client regeneration · **Depends on:** 02
**Spec:** [011 — Accounts payable](../../features/011-accounts-payable.md)

## Goal
Register and settle ("baixa") expenses of a condominium or the company.

## Scope
- [x] Model + API: `AccountPayable` (open → paid / cancelled; settle and cancel actions), Admin
- Moved out by the user's decision: the receipt file → part 06 (after the hosting); the screen to register and settle → part 07 (after the ledger)

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 011 `done`). `AccountPayable` with `/api/accounts-payable/` (CRUD, filters incl. due-date range and company expenses, search), the `settle` and `cancel` actions (model methods, atomic, row-locked), Admin, company scoping and audit (every change of amount or due date with the actor). A closed (paid/cancelled) account never changes; a paid one cannot be deleted; condominium and company expenses follow the cost-center pairing rule. Migration `finance.0005`.
Settling only marks the account for now: the ledger entry arrives with part 05, inside `settle()`. The receipt file (part 06) and the screens (part 07) were split out by the user's decision.
Frontend: 13 Portuguese texts and the regenerated client (no screen). Checked: `pytest apps -q` 495 passed, `mypy apps config` clean, `tsc`/`eslint`/`build` clean.