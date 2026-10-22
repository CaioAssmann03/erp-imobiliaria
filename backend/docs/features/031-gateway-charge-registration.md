---
summary: Spec 031 — register each issued billing document as an Asaas boleto charge (customer, charge, digitable line, Pix payload), keeping every attempt as a record.
read-when: you build or change the Asaas client calls for customers and charges, BillingDocumentRegistration, GatewayCustomer or the registration task
skip-if: sub-accounts and credentials → features/030-gateway-accounts.md; the payment webhook → roadmap/phase-5-billing-bank-integration/03-payment-webhook.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 031 — Gateway charge registration

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 02 · **Apps:** billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-21 | The registration is **automatic at issuance**: after a unit's document commits, a Celery task registers it when the condominium has an `active` gateway account; without one the document stays `issued` and the run reports `gateway_account_missing` | the user |
| 2026-10-21 | Built and tested with a fake client; validation against the Asaas sandbox stays pending (needs a CNPJ sandbox account, see spec 030) | the user |
| 2026-10-21 | `early_payment_discount_days` means days **before** the due date (0 = until the due date): sent as is as `dueDateLimitDays` | the user |
| 2026-10-21 | Phase decisions 2, 3, 5, 8 and 10 apply as written in the phase README (hosted boleto plus our PDF; fine, interest and discount sent; payer without document skipped; explicit registration lifetime; customer lookup before creation) | the user |
| 2026-10-21 | The charge is the commit point and the retry is a full re-run: the service finds an existing charge by `externalReference` (the document id) before creating one, then completes the missing details (digitable line, Pix) | agent, confirmed by the user on 2026-10-21 |
| 2026-10-21 | The Pix QR **image** is not stored: the payload and its expiry are; the image is drawn from the payload where it is shown (part 07) | agent, confirmed by the user on 2026-10-21 |
| 2026-10-21 | Retries: the task retries with backoff on a gateway outage (`unavailable`), never on a rejection (`rejected` is recorded as a `failed` registration with the gateway's codes) | agent, confirmed by the user on 2026-10-21 |

## R — Requirements
After a document is issued its boleto exists at Asaas and the system holds what is needed to show and pay it.
- [x] R1 — An issued document of a condominium with an `active` gateway account is registered as a BOLETO charge at the beneficiary's sub-account, and the document becomes `registered`
- [x] R2 — The charge carries the document id as `externalReference`, the amount, the due date, the fine, the monthly interest and the discount stored on the document, and an explicit registration lifetime from settings
- [x] R3 — The payer is a customer of the beneficiary account, created once per (person, account), looked up by `externalReference` then by `cpfCnpj` before creating, with Asaas notifications off
- [x] R4 — The registration stores the gateway payment id, boleto URL, our number, digitable line, barcode, Pix payload and Pix expiry
- [x] R5 — Registration is idempotent: a document with an active registration is not registered again, and a retry after a lost response reuses the charge found by `externalReference`
- [x] R6 — Every attempt is a record: a replaced one is `replaced`, a refused one is `failed` with the gateway's codes; nothing is deleted
- [x] R7 — A payer without CPF/CNPJ is skipped by the issuance with the new problem code `payer_without_document`; a condominium without an active account is reported as `gateway_account_missing`
- [x] R8 — A gateway outage is retried with backoff and leaves the document `issued`; a refusal is not retried
- [x] R9 — The documents API shows the active registration (boleto URL, digitable line, barcode, Pix payload, Pix expiry) and never a credential

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayCustomer` | new, `BaseModel`, `@final` | `person` FK `PROTECT`, `gateway_account` FK `PROTECT`, `gateway_customer_id` char; unique (`person`, `gateway_account`); `company_lookup = "gateway_account__condominium__company"` |
| `BillingDocumentRegistration` | new, `BaseModel`, `@final` | `document` FK `PROTECT` (`related_name="registrations"`), `gateway_account` FK `PROTECT`; `status` `active`/`replaced`/`failed`; `reason` `initial_issue`/`reissue`; `registered_due_date` date; `gateway_payment_id` char (unique when not blank); `our_number`, `digitable_line`, `barcode`, `boleto_url` blank-able; `pix_payload` text blank-able, `pix_expires_at` datetime null; `error_codes` JSON list; constraint: one `active` per document |
| `BillingRun.ProblemCode` | two members | `payer_without_document`, `gateway_account_missing` (no migration of data; the column is a free `JSONField`) |

## A — Approach
- Reuses `AsaasClient` (spec 030) with the **sub-account's** key; new calls: customers (lookup by `externalReference` and by `cpfCnpj`, create), payments (lookup by `externalReference`, create), `identificationField`, `pixQrCode`. A `429`/5xx/network failure is `unavailable` (retried); a 4xx is `rejected`.
- `services/register_billing_document.py` is the use case (no business rule): checks the document is `issued` and the account `active`, ensures the customer, finds or creates the charge, fetches the details, then in one transaction writes the registration and moves the document to `registered` (the model enforces the transition).
- The task `register_billing_document_task` is enqueued by name from the issuance, after the unit's transaction commits, like the PDF task; `autoretry_for` the gateway outage only.
- Term mapping (phase decision 3): `late_fee_percentage` → `fine` PERCENTAGE; `monthly_interest_percentage` → `interest`; `discount_percentage` and `discount_days` → `discount` PERCENTAGE with `dueDateLimitDays`; the first-days fine, the grace period and `interest_calculation` have no effect at the gateway.
- Rejected: registering inside the issuance transaction (a slow gateway would hold the unit's transaction and block the run).

## S — Structure
- `apps/billing/models/gateway_customer.py`, `billing_document_registration.py` (+ `rules/` only if two rules appear), migration `0006_…`, `errors/`, `admin.py` (read-only), `audit.py`
- `apps/billing/gateway/asaas_client.py` (new calls), `apps/billing/services/register_billing_document.py`, `tasks.py` (`register_billing_document_task`), `issue_condominium_billing.py` (enqueue and the two problem codes)
- `serializers/billing_document_serializers.py`, `views/billing_document_views.py`: the active registration on the detail and list of `billing-documents` (read only; `select_related`/`prefetch` to avoid N+1)
- `config/settings.py`: `ASAAS_REGISTRATION_LIFETIME_BUSINESS_DAYS` (default 60)
- Docs: `apps/billing.md`, `known-gaps.md` if any, roadmap part 02

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/billing-documents/`, `/api/billing-documents/{id}/` | — | adds `registration` (null or the active one's public fields) | read only, company scoped |

## O — Operations
1. Models, migration, Admin, audit (credentials do not exist here; the Pix payload is not secret but is not logged).
2. Client calls and error mapping.
3. Registration service, idempotency by `externalReference`.
4. Task and the enqueue from the issuance; the two problem codes.
5. Serializer and view; regenerate the frontend client.
6. Docs, roadmap, index.

## N — Norms
`conventions/practices.md` §3b (service per use case, rules in the models), naming per `conventions/naming.md`; the error codes are dotted and stable, the frontend translates them (`lib/error-messages.ts`).

## S — Safeguards
- Money: the amount and the due date sent are exactly the document's; a test compares them.
- A lost response must not create a second charge: R5 is covered by a test that simulates it.
- Rate limits: about four calls per charge; the task honors `429` by retrying later, never in a loop; no status polling.
- A failed registration keeps the gateway's error codes only, never the request body or a key.
- PII: the customer's name and CPF/CNPJ leave the system only to the gateway; they are not logged.
- The sandbox behavior (interest counting, the Pix QR without a key) is unvalidated until a CNPJ sandbox account exists.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_register_billing_document.py::test_registers_and_marks_document_registered` |
| R2 | `apps/billing/tests/test_register_billing_document.py::test_charge_carries_document_terms` |
| R3 | `apps/billing/tests/test_register_billing_document.py::test_customer_is_looked_up_then_created_once` |
| R4 | `apps/billing/tests/test_register_billing_document.py::test_registration_stores_boleto_and_pix_details` |
| R5 | `apps/billing/tests/test_register_billing_document.py::test_is_idempotent_and_reuses_charge_after_lost_response` |
| R6 | `apps/billing/tests/test_billing_document_registration.py::test_attempts_are_kept_and_one_is_active` |
| R7 | `apps/billing/tests/test_issue_condominium_billing.py::test_payer_without_document_and_missing_account_are_reported` |
| R8 | `apps/billing/tests/test_register_billing_document_task.py::test_outage_is_retried_and_rejection_is_not` (configuration) and `test_register_billing_document.py::test_a_refusal_is_kept_as_a_failed_registration` (a refusal is not raised) |
| R9 | `apps/billing/tests/test_billing_document_api.py::test_documents_show_the_active_registration` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Validation against the Asaas sandbox (customer, charge, `identificationField`, `pixQrCode`, interest counting) needs a CNPJ sandbox account, the same blocker as spec 030. The roadmap part stays `in-progress` until then.
