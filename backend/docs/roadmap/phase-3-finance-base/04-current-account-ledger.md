---
summary: Plan and status of part 04 of phase 3 — Current account, batches and ledger entries.
read-when: you work on current account, batches and ledger entries or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 04 — Current account, batches and ledger entries

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** new screens · **Depends on:** 01, 02
**Spec:** [014 — Ledger](../../features/history.md) (section 014) · screens: [016](../../features/history.md) (section 016) · statement completion: [017](../../features/history.md) (section 017)

## Goal
The statement (extrato) of a condominium: one current account per holder, entries grouped in batches, split by cost center.

## Scope
- [x] Models + API: `CurrentAccount`, `EntryBatch`, `CurrentAccountEntry` (with `post_entry`, reversal and Admin)
- [x] Screen: manual batch entry (one batch may cover several condominiums)
- [x] Screen: statement of the current account per condominium

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-06 (specs 014 and 016). Backend: `CurrentAccount` (one per condominium, cached `balance`), `EntryBatch`, `CurrentAccountEntry` (immutable, global `registry` sequence, manual or automatic origin), `post_entry`, `post_entries`, `reverse_entry`, the API (`current-accounts`, `entry-batches` with `POST /{id}/entries/`, `current-account-entries` with `POST /{id}/reverse/`) and a read-only Admin for entries; migrations `finance.0006`–`0009`. Frontend: the statement (`/finance/statement`) and the manual batch entry (`/finance/entries/new`).
Statement completion on 2026-10-06 (spec 017): balance by cost center (`GET /current-accounts/{id}/balances/`), optional `unit` on an entry, batch info and the reference-month filter. Still out: `serie_doc`/`registro_doc` and `documento_cobranca_item` (phase 4, billing).
