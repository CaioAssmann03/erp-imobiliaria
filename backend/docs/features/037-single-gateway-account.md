---
summary: Spec 037 — one Asaas account per company (the administradora) replaces the sub-account per condominium; the money lands in that account and the split into condominium accounts stays in the ledger.
read-when: you build or change the gateway account, its credentials, the webhook token lookup or how a charge is routed to a condominium's cost centers
skip-if: charge registration details → features/031-gateway-charge-registration.md; the payment posting → features/032-payment-webhook.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 037 — Single gateway account per company

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 01 · **Apps:** billing, core · **Frontend impact:** client regeneration

Supersedes the model of [spec 030](030-gateway-accounts.md) (one Asaas sub-account per condominium). Specs 031–036 keep their rules; only the account they point at changes.

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-26 | The administradora has **one** Asaas account that issues every boleto and receives every payment; condominiums have no account at the gateway and need no CNPJ | the user |
| 2026-10-26 | Each billing item names the **destination cost center** inside the condominium (by default its current account; a reserve fund or works fund when the item says so); the money is real only at the administradora, the split exists only in the ledger | the user |
| 2026-10-26 | One boleto per unit and month, carrying items for several cost centers (for example the condominium fee to the current account plus an extra charge to the works fund); a payment credits each item in its own cost center | the user |
| 2026-10-26 | Development and validation use the sandbox with the existing CPF account | the user |
| 2026-10-26 | One gateway account per `Company` (the model is already company-scoped), not a global singleton | agent, to be confirmed |
| 2026-10-26 | The bank registration fee that the administradora charges on the boleto (for example R$ 3.90, against R$ 1.20 paid to the gateway) is **never credited to the condominium**; it is a credit of the administradora in the system. This spec posts only the items, so a fee line cannot reach a condominium by accident; the fee itself is specified in [038](038-registration-fee.md) | the user |
| 2026-10-26 | The webhook is registered by the command (`setup_gateway_account --register-webhook`), with the Asaas panel as the documented alternative; the runbook in `architecture/operations.md` explains how it works | the user |
| 2026-10-26 | The production account stays a CPF account for now; whether Asaas accepts it for this use is checked before go-live | the user |
| 2026-10-26 | Existing data: assumed to be sandbox test data only (sub-account creation never worked on a CPF account); the migration moves an account to its condominium's company and refuses two accounts of one company instead of guessing | agent, to be confirmed |
| 2026-10-26 | The gross amount of each item is credited to the condominium (the fee of the gateway is not deducted); `net_amount` stays on the payment record | agent, to be confirmed (see 038 for the fee line) |

## R — Requirements
Today a condominium must have its own Asaas sub-account (a CNPJ parent, KYC of each síndico, a creation fee). The administradora collects on its own account, so every condominium is billed through the same account and the ledger does the split.
- [x] R1 — A `GatewayAccount` belongs to exactly one `Company` (one per company) and holds the encrypted API key and the encrypted webhook token; it has no per-condominium data
- [x] R2 — The credentials are never returned by the API, the Admin list, logs, error messages or the audit log
- [x] R3 — A charge for any unit of any condominium of the company is registered with that company's account; a company without an `active` account leaves the documents as drafts with the existing `gateway_account_missing` problem
- [x] R4 — The `GatewayCustomer` is unique per (person, account), so the same person is one customer for every condominium of the company
- [x] R5 — The webhook finds the account by the header token and the payment by `externalReference` (the document id), whatever the condominium; an unknown reference is `unprocessed`, as in spec 032
- [x] R6 — A paid document credits one entry per item in the item's own cost center (current account, reserve fund, works fund), in one transaction; the document total equals the sum of the items (unchanged from spec 032 R3)
- [x] R7 — The daily reconciliation runs once per company account and covers the payments of all its condominiums
- [x] R8 — A management command `setup_gateway_account <company_code>` stores the key given on a prompt (never as an argument, never echoed), generates the webhook token, checks the key with `GET /v3/myAccount/status` and sets the account `active`; it is idempotent (a second run replaces only the key and rotates nothing unless `--rotate-webhook-token` is given); `--register-webhook EMAIL` registers the webhook at the gateway, once
- [x] R9 — The sub-account onboarding (`onboard_condominium_at_gateway`, its command, the CNPJ lookup and the address rule) is removed

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayAccount` | changed | `condominium` OneToOne **replaced by** `company` OneToOne (`PROTECT`); `gateway_account_id`, `wallet_id` and `approved_at` dropped (they are sub-account data); `status` and the two encrypted fields stay; `company_lookup = "company"` |
| `GatewayCustomer` | changed | `company_lookup = "gateway_account__company"`; the unique (person, account) constraint stays |
| `GatewayEvent`, `GatewayReconciliationRun` | changed | `company_lookup = "gateway_account__company"` |
| `GatewayAccountError` | changed | `CONDOMINIUM_ADDRESS_INCOMPLETE` and `ALREADY_REGISTERED_REMOTELY` removed; `GATEWAY_UNAVAILABLE` and `GATEWAY_REJECTED` stay; `API_KEY_INVALID` and `WEBHOOK_URL_MISSING` added |

Constraint: unique `company`. No new table. Migration `billing.NNNN`: add `company` (nullable), fill it from `condominium.company`, then drop `condominium`, `gateway_account_id`, `wallet_id`, `approved_at` and make `company` required and unique. If two rows map to the same company, or any dependent row exists in a database that is not empty of billing data, it stops with a clear message instead of guessing (see the second open question).

## A — Approach
- The model change is the whole design: the rest of phase 5 already routes by `GatewayAccount`, so each lookup changes from `filter(condominium_id=...)` to `filter(company_id=<condominium>.company_id)`. `register_billing_document`, `reissue_billing_document`, `issue_condominium_billing`, the webhook view and `reconcile_gateway` are the call sites.
- The webhook account lookup by constant-time comparison stays, over at most one row per company.
- The split already lives where the rule says it must: `BillingDocumentItem.cost_center` and `entry_template`, posted by `post_billing_document_payment` (spec 032). Nothing about the ledger changes.
- Rejected: keeping sub-accounts and adding a "single mode" flag (two code paths, dead onboarding code); a global singleton account (the models are company-scoped); a split over the full charge value (forbidden by the Asaas terms, clause 7.3, and unnecessary here because the split is not at the gateway).

## S — Structure
- `apps/billing/models/gateway_account.py`, `gateway_customer.py`, `gateway_event.py`, `gateway_reconciliation_run.py`; migration `billing.NNNN`; `apps/billing/admin.py`
- `apps/billing/services/register_billing_document.py`, `reissue_billing_document.py`, `issue_condominium_billing.py`, `reconcile_gateway_account.py`; `apps/billing/views/gateway_webhook_views.py`; `apps/billing/management/commands/reconcile_gateway.py`
- New: `apps/billing/services/set_up_gateway_account.py`, `rotate_gateway_webhook_token.py`, `register_gateway_webhook.py`, `apps/billing/management/commands/setup_gateway_account.py`; `AsaasClient` gets `list_webhooks`, `create_webhook`, `update_webhook` and loses `find_accounts_by_document` and `create_account`
- Removed: `services/onboard_condominium_at_gateway.py`, `services/sync_gateway_account_status.py`, `management/commands/onboard_gateway_account.py`, their tests and the two error codes; `frontend/lib/error-messages.ts` and the generated client lose those codes
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
| R2 | `apps/billing/tests/test_gateway_account.py::test_credentials_stay_out_of_the_audit_log` |
| R3 | `apps/billing/tests/test_register_billing_document.py::test_uses_the_company_account_for_any_condominium` |
| R3 | `apps/billing/tests/test_issue_condominium_billing.py` (the issuance without an active account leaves drafts and reports `gateway_account_missing`, unchanged) |
| R4 | `apps/billing/tests/test_register_billing_document.py::test_uses_the_company_account_for_any_condominium` (one `GatewayCustomer` for two condominiums) |
| R5 | `apps/billing/tests/test_gateway_webhook.py::test_payment_is_found_by_reference_across_condominiums` |
| R6 | `apps/billing/tests/test_gateway_webhook.py::test_paid_document_credits_each_item_in_its_own_cost_center` |
| R7 | `apps/billing/tests/test_reconcile_gateway_account.py` (the daily task runs every active account, one per company) |
| R8 | `apps/billing/tests/test_set_up_gateway_account.py::test_stores_key_creates_token_and_activates`, `::test_is_idempotent_and_rotates_only_on_request`, `::test_a_refused_key_stores_nothing`, `::test_registers_the_webhook_once`, `::test_registering_needs_the_webhook_url` |
| R9 | `manage.py check`, `mypy` and the full suite (the removed modules have no references left); the migration: `apps/billing/tests/test_gateway_account_migration.py` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`): the two removed and two added error codes were edited by hand in `lib/api/generated/models/errorCodeEnum.ts` and `lib/error-messages.ts`; run the generator once with the backend up to confirm there is no other difference
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
The spec stays `in-progress` until: (1) the sandbox validation of step 5 with the CPF account (key check, webhook registration, a charge, the confirmed payment and the postings in the three cost centers); (2) the Asaas confirmation about collecting on the administradora's own account (Safeguards); (3) the user confirms the two decisions marked *agent, to be confirmed*.
