---
summary: Spec 037 — one Asaas account per company (the administradora) replaces the sub-account per condominium; the money lands in that account and the split into condominium accounts stays in the ledger.
read-when: you build or change the gateway account, its credentials, the webhook token lookup or how a charge is routed to a condominium's cost centers
skip-if: charge registration details → features/031-gateway-charge-registration.md; the payment posting → features/032-payment-webhook.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 037 — Single gateway account per company

**Status:** draft · **Level:** full · **Roadmap:** phase 5 part 01 · **Apps:** billing, core · **Frontend impact:** client regeneration

Supersedes the model of [spec 030](030-gateway-accounts.md) (one Asaas sub-account per condominium). Specs 031–036 keep their rules; only the account they point at changes.

## Open questions
- [ ] The Asaas fee per received boleto (R$ 0.99, then R$ 1.99) is a cost of the administradora. Does the ledger credit the **gross** amount to the condominium (the fee stays with the administradora) or the **net** amount? (recommended: gross, as spec 032 already does; `net_amount` stays recorded in `BillingDocumentPayment` for later accounting)
- [ ] Does any `GatewayAccount` row (and the customers, registrations, events and reconciliation runs that point at it) exist outside a local or sandbox database? (recommended: no, since sub-account creation never worked on a CPF account; the migration then needs no data carry-over and fails loudly if it finds rows)
- [ ] The webhook is registered at Asaas by our command (`POST /v3/webhooks`, to validate in the sandbox) or by the user in the Asaas panel? (recommended: by the command, with the user's panel as the documented fallback)
- [ ] Is the production Asaas account of the administradora a CPF or a CNPJ account? (not blocking: the sandbox CPF account is used for development; see Safeguards)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-26 | The administradora has **one** Asaas account that issues every boleto and receives every payment; condominiums have no account at the gateway and need no CNPJ | the user |
| 2026-10-26 | Each billing item names the **destination cost center** inside the condominium (by default its current account; a reserve fund or works fund when the item says so); the money is real only at the administradora, the split exists only in the ledger | the user |
| 2026-10-26 | One boleto per unit and month, carrying items for several cost centers (for example the condominium fee to the current account plus an extra charge to the works fund); a payment credits each item in its own cost center | the user |
| 2026-10-26 | Development and validation use the sandbox with the existing CPF account | the user |
| 2026-10-26 | One gateway account per `Company` (the model is already company-scoped), not a global singleton | agent, to be confirmed |

## R — Requirements
Today a condominium must have its own Asaas sub-account (a CNPJ parent, KYC of each síndico, a creation fee). The administradora collects on its own account, so every condominium is billed through the same account and the ledger does the split.
- [ ] R1 — A `GatewayAccount` belongs to exactly one `Company` (one per company) and holds the encrypted API key and the encrypted webhook token; it has no per-condominium data
- [ ] R2 — The credentials are never returned by the API, the Admin list, logs, error messages or the audit log
- [ ] R3 — A charge for any unit of any condominium of the company is registered with that company's account; a company without an `active` account leaves the documents as drafts with the existing `gateway_account_missing` problem
- [ ] R4 — The `GatewayCustomer` is unique per (person, account), so the same person is one customer for every condominium of the company
- [ ] R5 — The webhook finds the account by the header token and the payment by `externalReference` (the document id), whatever the condominium; an unknown reference is `unprocessed`, as in spec 032
- [ ] R6 — A paid document credits one entry per item in the item's own cost center (current account, reserve fund, works fund), in one transaction; the document total equals the sum of the items (unchanged from spec 032 R3)
- [ ] R7 — The daily reconciliation runs once per company account and covers the payments of all its condominiums
- [ ] R8 — A management command `setup_gateway_account <company_code>` stores the key given on a prompt (never as an argument, never echoed), generates the webhook token, checks the key with `GET /v3/myAccount/status` and sets the account `active`; it is idempotent (a second run rotates nothing unless `--rotate-webhook-token` is given)
- [ ] R9 — The sub-account onboarding (`onboard_condominium_at_gateway`, its command, the CNPJ lookup and the address rule) is removed

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayAccount` | changed | `condominium` OneToOne **replaced by** `company` OneToOne (`PROTECT`); `gateway_account_id`, `wallet_id` and `approved_at` dropped (they are sub-account data); `status` and the two encrypted fields stay; `company_lookup = "company"` |
| `GatewayCustomer` | changed | `company_lookup = "gateway_account__company"`; the unique (person, account) constraint stays |
| `GatewayEvent`, `GatewayReconciliationRun` | changed | `company_lookup = "gateway_account__company"` |
| `GatewayAccountError` | changed | `CONDOMINIUM_ADDRESS_INCOMPLETE` and `ALREADY_REGISTERED_REMOTELY` removed; `GATEWAY_UNAVAILABLE` and `GATEWAY_REJECTED` stay; `API_KEY_INVALID` added |

Constraint: unique `company`. No new table. Migration `billing.NNNN`: add `company` (nullable), fill it from `condominium.company`, then drop `condominium`, `gateway_account_id`, `wallet_id`, `approved_at` and make `company` required and unique. If two rows map to the same company, or any dependent row exists in a database that is not empty of billing data, it stops with a clear message instead of guessing (see the second open question).

## A — Approach
- The model change is the whole design: the rest of phase 5 already routes by `GatewayAccount`, so each lookup changes from `filter(condominium_id=...)` to `filter(company_id=<condominium>.company_id)`. `register_billing_document`, `reissue_billing_document`, `issue_condominium_billing`, the webhook view and `reconcile_gateway` are the call sites.
- The webhook account lookup by constant-time comparison stays, over at most one row per company.
- The split already lives where the rule says it must: `BillingDocumentItem.cost_center` and `entry_template`, posted by `post_billing_document_payment` (spec 032). Nothing about the ledger changes.
- Rejected: keeping sub-accounts and adding a "single mode" flag (two code paths, dead onboarding code); a global singleton account (the models are company-scoped); a split over the full charge value (forbidden by the Asaas terms, clause 7.3, and unnecessary here because the split is not at the gateway).

## S — Structure
- `apps/billing/models/gateway_account.py`, `gateway_customer.py`, `gateway_event.py`, `gateway_reconciliation_run.py`; migration `billing.NNNN`; `apps/billing/admin.py`
- `apps/billing/services/register_billing_document.py`, `reissue_billing_document.py`, `issue_condominium_billing.py`, `reconcile_gateway_account.py`; `apps/billing/views/gateway_webhook_views.py`; `apps/billing/management/commands/reconcile_gateway.py`
- New: `apps/billing/services/set_up_gateway_account.py`, `apps/billing/management/commands/setup_gateway_account.py`
- Removed: `services/onboard_condominium_at_gateway.py`, `management/commands/onboard_gateway_account.py` (and `services/sync_gateway_account_status.py` if the webhook no longer needs it), their tests and the two error codes; `frontend/lib/error-messages.ts` and the generated client lose those codes
- Docs: `apps/billing.md`, `architecture/operations.md` (how to set up the account), `.env.example`, roadmap phase 5 part 01 and decision 1 of the phase README, spec 030 note
- No new endpoint.

## O — Operations
1. Model and constraint changes, the migration and its guard; adjust the Admin.
2. Switch the call sites from condominium to company; keep the `gateway_account_missing` problem code.
3. `set_up_gateway_account` service and `setup_gateway_account` command; remove the onboarding service, command, errors and tests.
4. Reconciliation once per company account.
5. Validate in the sandbox with the CPF account: `GET /myAccount/status`, a customer, a boleto with `externalReference`, a Pix key, the webhook registration, `POST /v3/sandbox/payment/{id}/confirm` and the posting in the three cost centers. Record the result in `apps/billing.md` and in *Pending before done*.
6. Regenerate the frontend client; docs, roadmap, index.

## N — Norms
`conventions/practices.md` §3b (a service per use case, no business rule in it) and `conventions/naming.md`; the model stays `@final`. Names are English.

## S — Safeguards
- **Credentials:** encrypted at rest (`GATEWAY_CREDENTIALS_KEY`), excluded from serializers, the Admin list, `__repr__`, logs, exception messages and the audit log; the command reads the key from a prompt so it never lands in shell history. One key now guards the whole company's receivables: it is rotated by running the command again.
- **Money:** the real balance is the administradora's; this spec moves no money to a condominium, so the ledger is a record of what each condominium is owed, not of what it holds. The payout to the condominium is outside the system.
- **Fees:** the creation fee of a sub-account is gone; each received boleto still costs the administradora its Asaas fee (first open question).
- **Asaas terms and KYC (not validated):** the research behind spec 030 recorded that the documentation supports collecting for third parties through sub-accounts and forbids a split over the full value. Collecting on the administradora's own account and splitting only in the ledger is not described there either way. Before go-live, confirm with Asaas that this use is allowed for the holder (CPF or CNPJ) of the production account. Development is not blocked by it.
- **CPF account:** the sandbox accepts it for the calls of step 5; whether a production CPF account can issue boletos in volume is part of the same confirmation.
- **Data:** the migration never carries credentials over (they are sub-account keys, useless here); it refuses to run over existing dependent rows without an explicit decision.
- **Backward compatibility:** no API endpoint changes; only error codes are removed from the OpenAPI enum, so the client must be regenerated.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_gateway_account.py::test_one_account_per_company` |
| R2 | `apps/billing/tests/test_gateway_account.py::test_credentials_are_encrypted_and_never_exposed` |
| R3 | `apps/billing/tests/test_register_billing_document.py::test_uses_the_company_account_for_any_condominium` |
| R3 | `apps/billing/tests/test_issue_condominium_billing.py::test_company_without_active_account_leaves_drafts` |
| R4 | `apps/billing/tests/test_gateway_customer.py::test_one_customer_per_person_and_account` |
| R5 | `apps/billing/tests/test_gateway_webhook.py::test_payment_is_found_by_reference_across_condominiums` |
| R6 | `apps/billing/tests/test_automatic_billing_entry.py::test_paid_document_credits_each_item_in_its_cost_center` |
| R7 | `apps/billing/tests/test_reconcile_gateway_account.py::test_one_run_per_company_covers_all_condominiums` |
| R8 | `apps/billing/tests/test_set_up_gateway_account.py::test_stores_key_creates_token_and_activates` |
| R8 | `apps/billing/tests/test_set_up_gateway_account.py::test_is_idempotent_and_rotates_only_on_request` |
| R9 | gap: removal; covered by `manage.py check`, the docs checker and the absence of the deleted modules |

Layers: model/constraint, service, webhook API, reconciliation, command; the migration guard has its own test (`test_gateway_account_migration.py::test_refuses_rows_that_map_to_one_company_twice`).

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`)
- [ ] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Sandbox validation of step 5 with the CPF account, and the Asaas confirmation about collecting on the administradora's own account (Safeguards).
