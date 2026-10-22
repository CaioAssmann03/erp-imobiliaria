---
summary: Plan and status of part 05 of phase 5 — what happens to an overdue charge now that Asaas applies fine and interest: the reissue becomes the exception.
read-when: you work on overdue charges, the second copy of a boleto or changing the due date of a registered charge
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 05 — Overdue handling

**Status:** in-progress · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 02
**Spec:** [034](../../features/034-overdue-handling-reissue.md)

## Goal
Decide and build what an overdue document needs. The first plan reissued overdue boletos daily with fine and interest calculated by us; with Asaas the charge keeps being payable after its due date with the fine and interest it was created with.

## Scope
- [x] Registration lifetime: the boleto registration is cancelled automatically `daysAfterDueDateToRegistrationCancellation` business days after the due date (set when the charge is created, up to 3650, immutable; decided to send 60 by default, decision 8); `PAYMENT_BANK_SLIP_CANCELLED` announces it and the charge still exists. **Not documented:** how to revive such a charge; the safe path is to create a new charge for the same document (a new registration, the old one `replaced`)
- [x] If a charge expires or its terms must change: an operation that updates the charge's due date or creates a new one, recording a new registration (`reason` reissue) and replacing the old
- [x] Celery Beat daily task: not needed (decided: Asaas applies fine and interest itself; reissue is manual)
- [x] The second copy of a boleto for a payer is the same registration's URL, not a new charge

## Draft for the spec
### Entities
None new (uses `BillingDocumentRegistration` of part 02).

### Business rules
- A reissue never deletes the previous registration; the old charge is cancelled at the gateway so it cannot be paid twice.
- Overdue is derived from the due date and the status (spec 025); nothing stores it.

### Open questions
- [ ] Do we need any automatic reissue at all, or only a manual "reemitir" action for staff? (recommended: manual only in this phase, because Asaas applies the fine and interest itself while the registration lives; the registration window is set long at creation, part 02)
- [ ] Updating a charge: `PUT /v3/payments/{id}` (value, due date and billing type required; allowed while waiting for payment or overdue) fires `PAYMENT_UPDATED`; after it, fetch the digitable line and the Pix QR again. Whether the boleto is registered again and `bankSlipUrl` changes is **not documented**: store what comes back and treat the URL as changeable
- [ ] Is the monetary correction still wanted? (not modeled; the data model marks it as not modeled; recommended: no)

## Result
Implemented on 2026-10-22 (spec 034). Pending: validation of the delete call and the cancellation events against the sandbox.
