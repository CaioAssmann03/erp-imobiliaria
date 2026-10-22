---
summary: Plan and status of part 07 of phase 5 — the Cobrança screens for the gateway: registration, payment status, digitable line, Pix and the unprocessed queue (frontend).
read-when: you work on the screens that show a document's registration and payment, or resolve unprocessed payments
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 07 — Registration and payment screens

**Status:** in-progress · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 02, 03, 04, 06
**Spec:** [036](../../features/036-registration-payment-screens.md)

## Goal
Show on the existing documents screens what the gateway did: registered or not, the boleto link, the digitable line and Pix copy-paste, paid or not, delivery, and the payments that could not be matched.

## Scope
- [x] Document page: registration status, the boleto link, copy of the digitable line and the Pix code, payment date and amount, delivery status
- [x] Documents list: the status badge and the status filter already say registrado / pago (no new column)
- [x] Gateway account status and the unprocessed queue: the Django Admin (decided; no screen in this phase)
- [x] The reissue action of part 05

## Draft for the spec
### Entities
None new.

### Business rules
- None.

### Open questions
- [ ] Is the unprocessed queue a screen or only the Django Admin? (recommended: Admin in this phase)

## Result
Implemented on 2026-10-22 (spec 036). The boleto, payment and e-mail section and the reissue dialog are on the document page; `payment` was added to the documents API.
