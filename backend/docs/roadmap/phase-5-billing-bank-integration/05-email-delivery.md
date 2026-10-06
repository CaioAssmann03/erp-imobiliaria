---
summary: Plan and status of part 05 of phase 5 — E-mail delivery.
read-when: you work on e-mail delivery or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 05 — E-mail delivery

**Status:** todo · **Phase:** 5 (Billing issuance (bank)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 01
**Spec:** none yet

## Goal
Send the boleto automatically after issuance and track delivery.

## Scope
- [ ] Provider integration (Resend or SES)
- [ ] Model `BillingDocumentDelivery` (channel, status, destination) with Celery retry
- [ ] Provider webhook updates delivered/failed

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| EnvioDocumentoCobranca | `BillingDocumentDelivery` | channel email/whatsapp/mail/portal, sent at, status sent/failed, destination |

### Business rules
- None.

### Open questions
- [ ] Send the PDF attached or a download link? (recommended: link to a stored file; smaller, trackable)

## Result
Not started.
