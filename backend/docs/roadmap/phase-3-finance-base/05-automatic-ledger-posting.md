---
summary: Plan and status of part 05 of phase 3 — Automatic ledger posting rule.
read-when: you work on automatic ledger posting rule or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 05 — Automatic ledger posting rule

**Status:** todo · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** none · **Depends on:** 03, 04
**Spec:** none yet

## Goal
Settling an account payable creates the ledger entry in the same transaction. The most critical rule of the project.

## Scope
- [ ] Rule: settle `AccountPayable` -> debit `CurrentAccountEntry` (origin automatic_payable), inside `transaction.atomic()`
- [ ] Reversal (estorno): opposite entry, never physical delete
- [ ] Automated tests for amount, date, description, reversal and atomicity

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Description is built from supplier + cost center (e.g. "CEEE - Electricity"), no manual typing.
- Same rule for rental maintenance paid by the company (phase 8).

### Open questions
- [ ] Where does the rule live, given "business rules only in models"? (recommended: `AccountPayable.settle()` model method wrapping the entry creation, called by the view; no signals)

## Result
Not started.
