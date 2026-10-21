---
summary: Plan and status of part 03 of phase 5 — the Asaas payment webhook: stored events, idempotent processing, the document paid and one credit entry per item in the current account.
read-when: you work on the webhook endpoint, the gateway events or the ledger posting of a payment
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 03 — Payment webhook and ledger posting

**Status:** todo · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing, finance · **Frontend impact:** none · **Depends on:** 02
**Spec:** none yet

## Goal
When Asaas says a charge was paid, mark the document paid and post its items as credits in the condominium's current account, once, whatever the number of times the event arrives.

## Scope
- [ ] Public endpoint for the Asaas webhook, authenticated by the `asaas-access-token` header (the `authToken`, 32–255 characters, one per account), answering 200 as soon as the event is stored
- [ ] Model `GatewayEvent` (the event's `id`, the raw payload, received at, processed at, outcome); the event id is the unique key, a repeat is answered 200 and ignored; processing is a Celery task, never inside the request
- [ ] A received payment moves the document `registered` → `paid` (the status rules already exist, spec 025)
- [ ] Paid document → one credit entry per `BillingDocumentItem` in the condominium's current account, each with its cost center and entry template (`services/post_entry.py`)
- [ ] Amount check: the paid value against the expected one; a mismatch goes to an "unprocessed" queue instead of being posted

## Draft for the spec
### Entities
| Name | Code name | Notes |
|---|---|---|
| Evento do gateway | `GatewayEvent` | unique by the gateway event id; keeps the payload for audit; never edited |

### Business rules
- Payment of one document creates one credit entry per item (R$ 140 = R$ 100 fee + R$ 40 works fund -> two entries).
- Posting and the status change happen in one transaction; a repeated event changes nothing.
- The endpoint trusts nothing in the body: it checks the token, then the payment is looked up by its gateway id in our own records. Unknown fields in the payload are ignored (Asaas adds fields without notice).
- Delivery is at least once and unordered, so processing must not depend on the order of events; a failing endpoint is retried and, after 15 consecutive failures, Asaas pauses the queue (events kept 14 days, then deleted): the endpoint must stay fast and the reconciliation (part 04) is the safety net.

### Open questions
- [ ] Amount different from the charge (interest, discount, a fee the gateway took): how is it allocated across the items? (open since the data model; recommended: priority order, fee first; the amount comes from the event, interest and fine as their own entries if the cost centers exist)
- [ ] Does the amount ever legitimately differ from the charged one? The payload has `value`, `netValue` (after the Asaas fee) and, when the paid amount differs, `originalValue`; interest and fine make the paid value larger than the item sum. (recommended: no tolerance margin; post the items at their amounts and the difference as its own entry, or send it to the unprocessed queue when the cost center for it does not exist)
- [ ] Which event posts the ledger: decided (decision 9) `PAYMENT_RECEIVED`; `PAYMENT_CONFIRMED` is stored and shown as "em processamento"
- [ ] Handle `PAYMENT_DELETED`, `PAYMENT_REFUNDED` and `PAYMENT_BANK_SLIP_CANCELLED` (the charge exists but cannot be paid) in this part or in part 05? (recommended: record them as events here; act on them in part 05)

## Result
Not started.
