---
summary: Plan and status of part 04 of phase 5 — Daily reconciliation.
read-when: you work on daily reconciliation or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 04 — Daily reconciliation

**Status:** todo · **Phase:** 5 (Billing issuance (bank)) · **Apps:** billing, finance · **Frontend impact:** none · **Depends on:** 02
**Spec:** none yet

## Goal
Daily bank return applied to documents and to the ledger.

## Scope
- [ ] Celery Beat daily task: fetch the day's payments from the bank
- [ ] Tolerance margin: within the margin pay automatically; outside it goes to an "unprocessed return" queue
- [ ] Paid document -> one credit entry per `BillingDocumentItem` in the condominium's current account, each with its cost center

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Default tolerance as in Sami: up to R$ 15,00 less accepted automatically; more has no practical limit. Both margins are configurable.
- Payment of one document creates one credit entry per item (R$ 140 = R$ 100 fee + R$ 40 works fund -> two entries).

### Open questions
- [ ] Allocation of an amount that differs from the sum of items, when inside the tolerance: proportional, or priority order (fee first)? (open in the data model PDF; recommended: priority order, fee first)
- [ ] Webhook or polling for payments? (recommended: polling first, simpler to run on Render)

## Result
Not started.
