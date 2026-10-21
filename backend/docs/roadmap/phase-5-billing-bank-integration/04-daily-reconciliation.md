---
summary: Plan and status of part 04 of phase 5 — the daily reconciliation against Asaas that catches lost webhooks and feeds the unprocessed queue.
read-when: you work on the daily reconciliation task, the unprocessed queue or what to do when a payment event was lost
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 04 — Daily reconciliation

**Status:** todo · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing, finance · **Frontend impact:** none · **Depends on:** 03
**Spec:** none yet

## Goal
A webhook can be lost or arrive broken; once a day compare what Asaas says was paid with what we posted and fix the difference.

## Scope
- [ ] Celery Beat daily task: for each active gateway account, list the payments received in the last days and compare with the paid documents
- [ ] A payment we do not know yet is processed through the same path as the webhook (part 03), so there is one posting rule
- [ ] Differences that cannot be fixed (unknown charge, different amount) go to the unprocessed queue with their reason
- [ ] The run records what it found (a small audit like `BillingRun`)

## Draft for the spec
### Entities
None new, or a small `GatewayReconciliationRun` like `BillingRun` (decide in the spec).

### Business rules
- Reconciliation never posts twice: it uses the idempotency of part 03.
- The default look-back window and the queue's meaning are configurable.

### Open questions
- [ ] Look-back window and schedule? Asaas keeps undelivered events 14 days; (recommended: the last 3 days, daily after midnight, and a longer manual run after a webhook outage)
- [ ] Where is the unprocessed queue seen and resolved: the Admin first, a screen in part 07? (recommended: Admin first)

## Result
Not started.
