---
summary: Spec 033 — the daily reconciliation that compares the payments Asaas received with the documents paid here, posts what the webhook missed and queues what cannot be posted.
read-when: you build or change the reconciliation task, GatewayReconciliationRun or the reconcile_gateway command
skip-if: the webhook and the posting → features/032-payment-webhook.md; registering charges → features/031-gateway-charge-registration.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 033 — Daily reconciliation

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 04 · **Apps:** billing · **Frontend impact:** none

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | Window of 3 days (`GATEWAY_RECONCILIATION_WINDOW_DAYS`), daily at 00:30; a longer run by hand after a webhook outage (`manage.py reconcile_gateway --days N`) | the user (the part's recommendation) |
| 2026-10-22 | The unprocessed queue is the Django Admin (`GatewayEvent` filtered by outcome) in this phase; no screen | the user |
| 2026-10-22 | The run is recorded in a small `GatewayReconciliationRun` (like `BillingRun`); a payment is reconciled through a `GatewayEvent` with the id `reconciliation:<payment id>`, so the posting rule is the webhook's and a second run is harmless | agent, decided under the user's go-ahead to finish phase 5 (to review in the PR) |

## R — Requirements
- [x] R1 — For each `active` gateway account the task lists the payments received in the window (status `RECEIVED`, all pages) and compares them with the documents paid here
- [x] R2 — A payment not yet posted is processed by the same path as the webhook (`process_gateway_event`): one posting rule
- [x] R3 — Reconciliation never posts twice: a payment whose document is already `paid` is only counted, and a payment reconciled before is not stored or processed again
- [x] R4 — What cannot be posted (unknown charge, different amount, a refused posting) goes to the unprocessed queue with its reason
- [x] R5 — Each run is recorded (account, window, counts, status); a gateway outage fails that run with the error code and does not stop the other accounts
- [x] R6 — The schedule and the window are configuration; the command runs it by hand over any number of days

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayReconciliationRun` | new, `@final` | `gateway_account`, `window_start`, `window_end` (not before the start), `status` `running`/`succeeded`/`failed`, `found_count`, `already_posted_count`, `processed_count`, `unprocessed_count`, `error_code`, `started_at`, `finished_at` (not before the start) |

## A — Approach
`services/reconcile_gateway_account.py` reads the payments through `AsaasClient.list_received_payments` and hands each unknown one to `process_gateway_event` through a synthetic `GatewayEvent`. Rejected: a second posting path in the reconciliation (two rules would drift apart); polling statuses (it spends the API quota).

## S — Structure
`apps/billing/models/gateway_reconciliation_run.py` + migration `0008`, `services/reconcile_gateway_account.py`, `tasks.py` (`reconcile_gateway_accounts`), `management/commands/reconcile_gateway.py`, `gateway/asaas_client.py`, `admin.py` (read-only), `config/settings.py` (beat entry, window).

## O — Operations
1. Model and migration. 2. Client call. 3. Service. 4. Task, beat entry and command. 5. Admin. 6. Docs.

## N — Norms
Rules in the models (the run's window and times), the service holds none.

## S — Safeguards
- One request per 100 payments per account per day, far below the 25,000 requests per 12 hours.
- A `429` or 5xx fails the run (`gateway_account.gateway.unavailable`) and is tried again the next day or by hand.
- The window must cover Asaas's retention of undelivered events (14 days) when run by hand after an outage.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2 | `apps/billing/tests/test_reconcile_gateway_account.py::test_a_payment_the_webhook_missed_is_posted_through_the_same_path` |
| R3 | `…::test_it_never_posts_twice` |
| R4 | `…::test_what_cannot_be_posted_lands_in_the_unprocessed_queue_once` |
| R5 | `…::test_a_gateway_outage_fails_the_run_and_keeps_the_others_going`, `…::test_the_daily_task_runs_every_active_account` |
| R6 | `…::test_a_payment_the_webhook_missed_is_posted_through_the_same_path` (window) and the command (no test: a thin wrapper, a gap written down) |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Validation against the Asaas sandbox: the date filter names (`paymentDate[ge]`, `paymentDate[le]`) and the paging of `GET /payments` (needs a CNPJ sandbox account).
