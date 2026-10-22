---
summary: Spec 030 — GatewayAccount, one Asaas sub-account per condominium, with API key and webhook token stored encrypted, onboarding and status sync.
read-when: you build or change the Asaas sub-accounts, their credentials, their status or the onboarding of a condominium at the gateway
skip-if: charge registration → roadmap/phase-5-billing-bank-integration/02-gateway-charge-registration.md; the process → features/README.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 030 — Gateway accounts

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 01 · **Apps:** billing · **Frontend impact:** none

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-21 | The ten decisions of the phase 5 README are confirmed as written (sub-account per condominium, hosted boleto plus our PDF, webhook plus daily reconciliation, `PAYMENT_RECEIVED` posts the ledger) | the user |
| 2026-10-21 | The administradora collects the síndico's KYC documents and guides them through the Asaas `onboardingUrl` | the user |
| 2026-10-21 | API keys and webhook tokens are stored encrypted in the database (Fernet); the environment holds one key, `GATEWAY_CREDENTIALS_KEY` | the user |
| 2026-10-21 | Owner of the production account and a fixed IP of the VPS are unknown: **external pending, not blocking**; development runs on the sandbox. Lost-key reissue (`/accessTokens`) is out of scope until the IP is known | the user |
| 2026-10-21 | The homologation is requested before go-live; the sandbox evaluation period is turned off for development | the user (phase README, decision 1) |
| 2026-10-21 | Whether a Pix key can be registered by API is **validated in the sandbox during implementation**; if not, it becomes a documented manual onboarding step and the status stays `pending` until it is done | agent, to be confirmed |

## R — Requirements
Every billed condominium needs an Asaas sub-account that is the beneficiary of its boletos, and the system must hold its credentials safely.
- [x] R1 — A `GatewayAccount` belongs to exactly one condominium (one per condominium) and has a status `pending`, `active` or `blocked`
- [x] R2 — The API key and the webhook token are stored encrypted and are never returned by the API, the Admin list, logs or error messages
- [x] R3 — Onboarding a condominium creates its sub-account at Asaas from its CNPJ, address and the required data, and stores the key and wallet id the response gives once
- [x] R4 — Onboarding is idempotent: a condominium that already has a `GatewayAccount` is not created twice, also after a timeout
- [x] R5 — The status follows Asaas: `ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED` (webhook) or `GET /v3/myAccount/status` set it `active`; a rejection sets it `blocked`
- [x] R6 — A condominium without an `active` account cannot have charges registered (the rule is exposed here as a model method; the issuance uses it in part 02)
- [x] R7 — A failed Asaas call leaves no half-created record and raises a typed error with a stable code

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayAccount` (`Conta no gateway`) | new, `BaseModel`, `@final` | `condominium` OneToOne (`PROTECT`); `gateway_account_id` char (Asaas id); `wallet_id` char; `status` choices `pending/active/blocked`, default `pending`; `api_key` encrypted text; `webhook_token` encrypted text; `approved_at` datetime null |

Constraint: unique `condominium`. Rule in `models/rules/gateway_account.py` only if two or more rules appear; a single rule goes in `clean()`.

## A — Approach
- `EncryptedTextField` in `apps/core` (Fernet from `GATEWAY_CREDENTIALS_KEY`): the value is encrypted on save and decrypted on read; a missing or invalid key fails at startup, not at first use. Rejected: environment-only keys (do not scale to a key per condominium) and a secrets manager (not available).
- `services/onboard_condominium_at_gateway.py`: one use case, one transaction around the local write; the HTTP call goes through a small `AsaasClient` (`apps/billing/gateway/asaas_client.py`, `urllib3` (already a dependency; `httpx` is not installed), base URL and parent key from settings) that part 02 reuses. Before creating, it locks the condominium row and looks the CNPJ up at Asaas (`GET /accounts?cpfCnpj=`) to survive a timeout (R4); an account found there without a local record cannot be recovered (the key is shown once) and is reported for manual handling.
- `services/sync_gateway_account_status.py`: reads `GET /v3/myAccount/status` with the sub-account key; the webhook handler of part 03 calls it for the approval event.
- Sandbox first: the period of evaluation is turned off in the sandbox account; production values come from the environment.

## S — Structure
- `apps/billing/models/gateway_account.py`, `apps/billing/migrations/NNNN_gatewayaccount.py`, `apps/billing/admin.py` (read-only, credentials excluded, "Sync status" action)
- `apps/core/fields/encrypted_text.py`; `config/settings` reads `GATEWAY_CREDENTIALS_KEY`, `ASAAS_API_KEY`, `ASAAS_BASE_URL`
- `apps/billing/gateway/asaas_client.py`, `apps/billing/services/onboard_condominium_at_gateway.py`, `apps/billing/services/sync_gateway_account_status.py`, `apps/billing/errors/gateway_account.py`
- `.env.example` (placeholder for `GATEWAY_CREDENTIALS_KEY` with the generation command); `architecture/overview.md`; `apps/billing.md`
- No endpoint in this spec: onboarding runs from the management command `onboard_gateway_account <condominium_code>`.

## O — Operations
1. `EncryptedTextField` and its tests; settings and `.env.example`.
2. `GatewayAccount` model, migration, Admin (credentials never listed).
3. `AsaasClient` with timeouts, `429` handling by `RateLimit-Reset`, and typed errors.
4. Onboarding service and command; Admin only lists and syncs status (onboarding needs the síndico's e-mail, phone and income, which the Admin cannot collect).
5. Status sync service.
6. Validate in the sandbox: sub-account creation, status read, Pix key registration by API (record the result in `apps/billing.md`).
7. Docs, roadmap part 01, index.

## N — Norms
Names and layout per `conventions/naming.md` and `conventions/practices.md` §3b (service per use case, no rule in the service). Names are English; the model is `@final`.

## S — Safeguards
- Credentials: encrypted at rest, excluded from serializers, Admin list, `__repr__`, logs and exception messages; tests assert it.
- A missing or wrong `GATEWAY_CREDENTIALS_KEY` stops the app; rotating the key needs a re-encryption command (documented, not built here).
- The Asaas key is shown once: the record is written in the same transaction that receives the response; if the write fails the error is logged without the key and the sub-account must be handled manually (documented in the runbook).
- Real calls only against the sandbox in tests (mocked `httpx`); no network in the test suite.
- The credentials are also excluded from the audit log (`register_audited(..., excluded_fields=...)`), covered by `test_credentials_stay_out_of_the_audit_log`.
- The creation of a sub-account has a fixed fee at Asaas: the command asks for confirmation outside the sandbox.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_gateway_account.py::test_one_account_per_condominium` |
| R2 | `apps/billing/tests/test_gateway_account.py::test_credentials_are_encrypted_and_never_exposed` |
| R3 | `apps/billing/tests/test_onboard_condominium_at_gateway.py::test_creates_sub_account_and_stores_credentials` |
| R4 | `apps/billing/tests/test_onboard_condominium_at_gateway.py::test_is_idempotent_after_timeout` |
| R5 | `apps/billing/tests/test_sync_gateway_account_status.py::test_approval_activates_and_rejection_blocks` |
| R6 | `apps/billing/tests/test_gateway_account.py::test_only_active_account_can_register_charges` |
| R7 | `apps/billing/tests/test_onboard_condominium_at_gateway.py::test_failure_leaves_no_record` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Sandbox validation run on 2026-10-21 with the key in the local `.env`:
- Works: `GET /myAccount/status` (returns `general`), `GET /accounts?cpfCnpj=` (returns `data` as a list), `POST /pix/addressKeys` with `{"type": "EVP"}` creates a Pix key by API (tested on the parent account; assumed identical with a sub-account key).
- **Blocked:** `POST /accounts` answers 403 *"Contas de pessoa física (CPF) não podem criar subcontas"*: the sandbox account behind the key is a CPF account (`personType: FISICA`). Sub-accounts need a **CNPJ** parent, as the docs say. The creation request (including the `webhooks` field) and the status read with a sub-account key are therefore still unvalidated.
- Also seen: an empty creation request asks for a birth date, which applies to individuals; a CNPJ sub-account may not need it.
- To finish: create a sandbox account as a legal entity (any valid CNPJ works in the sandbox), put its key in `ASAAS_API_KEY` and run `onboard_gateway_account` once. The roadmap part stays `in-progress` until then.
