---
summary: Plan and status of part 07 of phase 3 — Accounts payable screens.
read-when: you work on accounts payable screens or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 07 — Accounts payable screens

**Status:** todo · **Phase:** 3 (Finance base) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 05
**Spec:** none yet (planned: full)

## Goal
The staff register, list and settle accounts payable in the Next frontend, after settling creates its ledger entry.

## Scope
- [ ] Screen: list and filter accounts payable (status, supplier, condominium, due date)
- [ ] Screen: register and edit an account payable (supplier, condominium or company expense, cost center, amounts, dates)
- [ ] Action: settle ("baixa": date, amount paid, method) and cancel
- [ ] The receipt upload control, once part 06 exists

## Draft for the spec
Moved out of part 03 by the user's decision (2026-10-05): the screens are built after the settlement posts to the ledger, so they are not built twice.

### Entities
None new.

### Business rules
- Errors are translated by code (`lib/error-messages.ts`); the screen only shows what the API answers.

### Open questions
- [ ] Where does it live in the navigation (a finance section)? (recommended: a "Financeiro" group with accounts payable first)

## Result
Not started.
