---
summary: Plan and status of part 04 of phase 3 — Current account, batches and ledger entries.
read-when: you work on current account, batches and ledger entries or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 04 — Current account, batches and ledger entries

**Status:** todo · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** new screens · **Depends on:** 01, 02
**Spec:** none yet

## Goal
The statement (extrato) of a condominium: one current account per holder, entries grouped in batches, split by cost center.

## Scope
- [ ] Models + API: `CurrentAccount`, `EntryBatch`, `CurrentAccountEntry`
- [ ] Screen: manual batch entry (one batch may cover several condominiums)
- [ ] Screen: statement of the current account per condominium

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| ContaCorrente | `CurrentAccount` | one per holder; `balance` is computed, never edited |
| Lote | `EntryBatch` | origin cash / extra_cash / bank; may group entries of many condominiums |
| LancamentoContaCorrente | `CurrentAccountEntry` | global sequential `registry` number, entry template, cost center, competence month, kind credit/debit, origin automatic_payable / automatic_billing / manual |

### Business rules
- Balance = sum(credits) - sum(debits), always computed.
- An entry is never deleted, only reversed by an opposite entry.
- Manual entries require a responsible user and a justification.
- Every entry stores user and timestamp.

### Open questions
- [ ] Global sequential `registry`: database sequence or computed? (recommended: PostgreSQL sequence, never reused)
- [ ] Same holder question as part 03 (polymorphic holder).

## Result
Not started.
