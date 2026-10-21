---
summary: Plan and status of part 02 of phase 5 — the Asaas client and the registration of each issued document as a charge, keeping every attempt as a record.
read-when: you work on the gateway client, customers, charge creation or the registration record of a document
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 02 — Charge registration

**Status:** todo · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
After a document is issued, create its charge at Asaas (boleto with Pix) and store what comes back: the gateway id, the boleto URL, our number, the digitable line, the barcode and the Pix payload.

## Scope
- [ ] `httpx` client for the Asaas API, using the beneficiary condominium's credentials; timeouts, retry with backoff and error recording
- [ ] Customers: the payer as an Asaas customer of the beneficiary account (`GatewayCustomer`), created once and reused; Asaas notifications turned off
- [ ] Model `BillingDocumentRegistration` (every attempt is a record; a document's current one is `active`; a replaced one is `replaced`, never deleted)
- [ ] Celery task: register each issued document; the document goes from `issued` to `registered`
- [ ] Send the terms the document already stores (fine, interest, discount) with the charge
- [ ] QR code image from the Pix payload

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
- [ ] **Terms that do not map.** The gateway takes one fine (percentage or fixed), one monthly interest percentage and one discount (percentage or fixed, N days before the due date); it has no first-days fine tier, no grace period and no `full_month`/`per_day` choice that the documentation shows. What do we do with `initial_late_fee_*`, `interest_grace_days` and `interest_calculation` for gateway charges? (decision 3 of the phase; recommended: send what maps, keep the rest as data, and ask Asaas how its interest is counted)
- [ ] How long must the boleto registration stay alive? `daysAfterDueDateToRegistrationCancellation` is set at creation and cannot change; the account default is unknown. (decision 8; recommended: set it explicitly and long)
- [ ] A Pix key must be registered in the beneficiary account for the boleto to show the Pix QR code: part of the account onboarding?
- [ ] The sandbox can confirm a charge through `POST /v3/sandbox/payment/{id}/confirm` and fires the webhooks; does it also return the digitable line and the Pix payload? (check while building the client)
- [ ] How is the customer's Asaas notification turned off, and is the customer's e-mail required? (not found in the pages read)

## Result
Not started.
