---
summary: Plan and status of part 02 of phase 5 — Bank registration records.
read-when: you work on bank registration records or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 02 — Bank registration records

**Status:** todo · **Phase:** 5 (Billing issuance (bank)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
Every bank attempt of a document is a record; reissues never overwrite.

## Scope
- [ ] Models + API: `BankSlipRegistration`

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| RegistroBancarioBoleto | `BankSlipRegistration` | bank account, our number, digitable line, barcode, registered due date, status active/replaced/written_off, reason initial_issue/overdue_reissue |

### Business rules
- On reissue the current record becomes `replaced` and a new one is created; nothing is deleted.

### Open questions
- None.

## Result
Not started.
