---
summary: Plan and status of part 02 of phase 5 — the Asaas client and the registration of each issued document as a charge, keeping every attempt as a record.
read-when: you work on the gateway client, customers, charge creation or the registration record of a document
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 02 — Charge registration

**Status:** in-progress · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** [031](../../features/031-gateway-charge-registration.md)

## Goal
After a document is issued, create its charge at Asaas (boleto with Pix) and store what comes back: the gateway id, the boleto URL, our number, the digitable line, the barcode and the Pix payload.

## Scope
- [x] `urllib3` client (`httpx` is not a dependency) for the Asaas API, using the beneficiary condominium's credentials; timeouts, retry with backoff and error recording
- [x] Customers: the payer as an Asaas customer of the beneficiary account (`GatewayCustomer`), created once and reused; Asaas notifications turned off
- [x] Model `BillingDocumentRegistration` (every attempt is a record; a document's current one is `active`; a replaced one is `replaced`, never deleted)
- [x] Celery task: register each issued document; the document goes from `issued` to `registered`
- [x] Send the terms the document already stores (fine, interest, discount) with the charge
- [x] Pix payload and expiry stored (the QR image is drawn from the payload where it is shown, part 07)

## Draft for the spec
### Entities
| Name | Code name | Notes |
|---|---|---|
| RegistroBancarioBoleto | `BillingDocumentRegistration` | document, gateway account, gateway payment id, our number, digitable line, barcode, boleto URL, Pix payload, registered due date, status active/replaced/failed, reason initial_issue/reissue, error |
| Cliente no gateway | `GatewayCustomer` | person, gateway account, external id; unique per (person, account) |

### Business rules
- A payer without CPF/CNPJ cannot be a customer: the issuance gets a new problem code `payer_without_document` and skips the unit (spec 026 gains a code).
- On a reissue the current record becomes `replaced` and a new one is created; nothing is deleted.
- Registration is idempotent: a document with an active registration is not registered again; the document's id travels as the charge's `externalReference` (a free, searchable field) so a retry looks for it before creating a second charge.
- The digitable line, barcode and `nossoNumero` come from `GET /v3/payments/{id}/identificationField`, fetched after the charge is created and again after any change of value or due date.

### Open questions
- [ ] Official boleto: the Asaas hosted boleto or our own PDF with a barcode? (decision 2 of the phase; recommended: the Asaas boleto; our PDF stays as the statement of items)
- [ ] **Terms that do not map** (decided, decision 3): the gateway takes one fine, one monthly interest percentage and one discount; the first-days fine, the grace period and `interest_calculation` stay as data without effect on gateway charges, and the condominium screen says so. To validate in the sandbox: how the interest is counted
- [ ] Registration lifetime (decided, decision 8): `daysAfterDueDateToRegistrationCancellation` is sent explicitly from a setting (default 60 business days) because it cannot change after creation
- [ ] Customers (decided, decision 10): looked up by `externalReference` (the person's id) and then by `cpfCnpj` before creating, because the API allows duplicates; `notificationDisabled: true`; only `name` and `cpfCnpj` are required
- [ ] The Pix QR comes from `GET /v3/payments/{id}/pixQrCode` (`encodedImage`, `payload`, `expirationDate`); without a Pix key in the account it expires at 23:59 of the same day, so the key is part of the onboarding (part 01)
- [ ] Rate limits: 25,000 requests per account every 12 hours and 50 concurrent GETs; a charge costs about four calls (customer lookup/creation, charge, digitable line, Pix QR), so the client must honor `429` and `RateLimit-Reset` and never poll
- [ ] The sandbox confirms a charge through `POST /v3/sandbox/payment/{id}/confirm` and fires the webhooks; does it also return the digitable line and the Pix payload without a Pix key? (check while building the client)

## Result
Implemented on 2026-10-22 (spec 031): customers, registration records, the registration service and task, the two new issuance problem codes and `registration` on the documents API. Pending: validation against the Asaas sandbox (needs a CNPJ sandbox account); the digitable line and barcode are refetched after a change of value or due date in part 05.
