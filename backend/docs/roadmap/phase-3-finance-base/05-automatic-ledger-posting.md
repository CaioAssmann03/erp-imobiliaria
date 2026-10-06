---
summary: Plan and status of part 05 of phase 3 — Automatic ledger posting rule.
read-when: you work on automatic ledger posting rule or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 05 — Automatic ledger posting rule

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** none · **Depends on:** 03, 04
**Spec:** [015 — Automatic ledger posting](../../features/history.md) (section 015)

## Goal
Settling an account payable creates the ledger entry in the same transaction. The most critical rule of the project.

## Scope
- [x] Rule: settle `AccountPayable` -> debit `CurrentAccountEntry` (origin automatic_payable), inside `transaction.atomic()`
- [x] Reversal (estorno): opposite entry, never physical delete
- [x] Automated tests for amount, date, description, reversal and atomicity

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-06 (spec 015). Settling a condominium's account payable posts its debit in the same transaction (`settle_account_payable` → `post_account_payable_entry` → `post_entry`); a company expense posts nothing. `AccountPayable.entry_template` (required to pay a condominium expense), `AccountPayablePayment.settled_by`, a bank batch per payment and the current account created on the first posting. Migration `finance.0009`. The rule lives in the models (`CurrentAccountEntry.paying()`, `AccountPayableRules`); the service only coordinates.
Frontend: 30 Portuguese texts; the client must be regenerated (`npm run generate:api`).
