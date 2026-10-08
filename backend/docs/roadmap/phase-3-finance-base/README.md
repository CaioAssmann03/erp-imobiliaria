---
summary: Phase 3 (Finance base) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 3: finance base
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 3 — Finance base

**Status:** done · **Source:** Sprint 3 of the sprints PDF · **Depends on:** phase 3a

## Goal
Accounts payable, current account (ledger) and the most critical rule of the project: paying an account payable automatically creates a ledger entry.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Finish cost center and entry template API](01-cost-center-entry-template-api.md) | done | finance |
| 02 | [Suppliers and bank accounts](02-suppliers-and-bank-accounts.md) | done | finance |
| 03 | [Accounts payable](03-accounts-payable.md) | done | finance |
| 04 | [Current account, batches and ledger entries](04-current-account-ledger.md) | done | finance |
| 05 | [Automatic ledger posting rule](05-automatic-ledger-posting.md) | done | finance |
| 06 | [Payment receipts](06-payment-receipts.md) | done | finance, frontend |
| 07 | [Accounts payable screens](07-accounts-payable-screens.md) | done | frontend |

## Notes
Contains the critical financial rules; test them first (see `architecture/quality.md`). Parts 06 and 07 were split out of part 03 (user decision, 2026-10-05): the receipt waits for the hosting, the screens for the ledger.

## Closing checklist
- [x] Every part is `done` or `moved`
- [x] Docs of the affected apps updated
- [x] `known-gaps.md` rows closed (row 31, orphan receipt objects, is a new low-severity gap, not a blocker)
- [x] Frontend client regenerated (if the API changed)
