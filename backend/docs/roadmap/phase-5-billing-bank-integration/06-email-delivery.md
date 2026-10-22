---
summary: Plan and status of part 06 of phase 5 — sending the boleto by e-mail after registration and tracking the delivery.
read-when: you work on the e-mail provider, the delivery record or the delivery webhook
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 06 — E-mail delivery

**Status:** in-progress · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 02
**Spec:** [035](../../features/035-email-delivery.md)

## Goal
Send the boleto to the payer automatically once the charge is registered, and know whether it was delivered.

## Scope
- [x] Provider integration (Resend, whose key is already in `.env.example`)
- [x] Model `BillingDocumentDelivery` (channel, status, destination, sent at) with Celery retry
- [x] The e-mail carries a link to the boleto and the digitable line, not an attachment
- [x] Provider webhook updates delivered/failed
- [x] The gateway's own customer notifications stay off (part 02)

## Draft for the spec
### Entities
| PDF name | Code name | Notes |
|---|---|---|
| EnvioDocumentoCobranca | `BillingDocumentDelivery` | channel email/whatsapp/mail/portal, sent at, status sent/failed/delivered, destination |

### Business rules
- A payer without an e-mail is recorded as a failed delivery with a reason, never silently skipped.
- Sending happens after the registration commits and never blocks it.

### Open questions
- [ ] Attach the PDF or send a link? (recommended: a link to the boleto; smaller and trackable)
- [ ] Use Asaas's own e-mail instead of ours? (recommended: ours, to control the text and track it; Asaas notifications off)

## Result
Implemented on 2026-10-22 (spec 035). Pending: a real send and the webhook against Resend (a verified domain and the keys).
