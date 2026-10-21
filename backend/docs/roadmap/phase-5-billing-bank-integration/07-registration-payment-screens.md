---
summary: Plan and status of part 07 of phase 5 — the Cobrança screens for the gateway: registration, payment status, digitable line, Pix and the unprocessed queue (frontend).
read-when: you work on the screens that show a document's registration and payment, or resolve unprocessed payments
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 07 — Registration and payment screens

**Status:** todo · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 02, 03, 04, 06
**Spec:** none yet

## Goal
Show on the existing documents screens what the gateway did: registered or not, the boleto link, the digitable line and Pix copy-paste, paid or not, delivery, and the payments that could not be matched.

## Scope
- [ ] Document page: registration status, the boleto link, copy of the digitable line and the Pix code, payment date and amount, delivery status
- [ ] Documents list: a "registrado / pago" indication and a filter by it
- [ ] Gateway account status per condominium and the unprocessed payments queue (Admin first; a screen if asked)
- [ ] Re-register or reissue actions of part 05, if built

## Draft for the spec
### Entities
None new.

### Business rules
- None.

### Open questions
- [ ] Is the unprocessed queue a screen or only the Django Admin? (recommended: Admin in this phase)

## Result
Not started.
