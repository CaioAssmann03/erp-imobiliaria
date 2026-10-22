---
summary: Spec 032 — the Asaas payment webhook: stored events, idempotent processing, a received payment posted as one credit per item and the document paid.
read-when: you build or change the webhook endpoint, GatewayEvent, the payment posting or the unprocessed queue
skip-if: registering charges → features/031-gateway-charge-registration.md; the daily safety net → features/033-daily-reconciliation.md; the ledger itself → apps/finance.md
---
# 032 — Payment webhook and ledger posting

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 03 · **Apps:** billing, finance · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | A paid amount that differs from the document's amount posts nothing: the event goes to the `unprocessed` queue (Admin) with the reason `amount_mismatch`; there is no tolerance margin | the user |
| 2026-10-22 | `PAYMENT_RECEIVED` posts the ledger; `PAYMENT_CONFIRMED`, `OVERDUE` and unknown events are stored and `ignored` (the cancellations and the refund are handled by spec 034) | the user (phase decision 9 and the part's recommendation) |
| 2026-10-22 | The automatic entry has a new origin `automatic_billing`, no user (`created_by` nullable, only for that origin, by a constraint) and a unique FK to its `BillingDocumentItem` (one entry per item) | the user |
| 2026-10-22 | The webhook finds the account by comparing the header token with each account's token in constant time (tokens are encrypted, so no database lookup); `BillingDocumentPayment` keeps the payment (date, amount, net amount) for the screens; `GatewayEvent` is exempt from the audit log (it is the record) and its Admin can reprocess `unprocessed` events | agent, decided under the user's go-ahead to finish phase 5 (to review in the PR) |

## R — Requirements
When Asaas says a charge was paid, the document is paid and its items are credited in the condominium's current account, once.
- [x] R1 — The endpoint refuses a missing or wrong `asaas-access-token` (401) and a malformed body (400) without storing anything
- [x] R2 — A valid event is stored first and answered 200 (a repeat too); processing is a Celery task enqueued after the commit, never inside the request
- [x] R3 — `PAYMENT_RECEIVED` of an active registration of a `registered` document, with the paid value equal to the document's, posts one credit per item (its cost center and entry template, dated by the payment) and moves the document to `paid`, in one transaction
- [x] R4 — A repeated event, or a second event for the same payment, posts nothing twice
- [x] R5 — A different paid value posts nothing: the event is `unprocessed` with `amount_mismatch`
- [x] R6 — A payment of an unknown charge, a non-active registration or a document that is not `registered` is `unprocessed` with its reason; an already paid document is `ignored`
- [x] R7 — Any other event is stored and `ignored`
- [x] R8 — A posting the ledger refuses leaves nothing posted and the event `unprocessed` (`posting_refused`, with the error codes)
- [x] R9 — The ledger accepts an `automatic_billing` entry without a user, refuses any other origin without one, and refuses a second entry for the same item

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `GatewayEvent` | new, `@final` | `gateway_account`, `event_id` (unique), `event_type`, `payload` JSON, `received_at`, `processed_at`, `outcome` `pending`/`processed`/`ignored`/`unprocessed`, `reason`, `error_codes` |
| `BillingDocumentPayment` | new, `@final` | `document` OneToOne, `registration`, `gateway_event`, `paid_on`, `amount`, `net_amount` |
| `CurrentAccountEntry` | changed (additive migration `finance.0012`) | origin `automatic_billing`; `billing_document_item` FK (unique when set); `created_by` nullable; constraints for both |

## A — Approach
- The view only authenticates and stores; `services/process_gateway_event.py` decides and `services/post_billing_document_payment.py` posts (it reuses `post_entries`). A refused posting runs in a savepoint so the event can still be marked.
- Rejected: processing inside the request (a slow endpoint pauses Asaas's queue after 15 failures); a system user per company for `created_by`.

## S — Structure
- `apps/billing/models/gateway_event.py`, `billing_document_payment.py`, migration `billing.0007`; `apps/finance/models/current_account_entry.py`, `models/rules/current_account_entry.py`, `errors/`, migration `finance.0012`
- `apps/billing/views/gateway_webhook_views.py`, `urls.py`, `tasks.py` (`process_gateway_event_task`), `admin.py`
- `POST /api/webhooks/asaas/` (no JWT, excluded from the OpenAPI schema)

## O — Operations
1. Ledger change and its tests. 2. Models and migration. 3. Services. 4. View, URL, task. 5. Admin. 6. Docs and client.

## N — Norms
Rules in the models (the ledger rules and constraints), services hold none (`conventions/practices.md` §2, §3b).

## S — Safeguards
- The body is trusted for nothing but being stored; the payment is looked up in our own records by its gateway id and account.
- Posting and the status change are one transaction; the unique FK per item is the last line of defence against a double posting.
- The endpoint stays fast (one insert) so the gateway's queue is not paused; a lost event is covered by the reconciliation (spec 033).
- Tokens are compared with `hmac.compare_digest`; no token or credential is logged.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_gateway_webhook.py::test_a_missing_or_wrong_token_is_refused`, `::test_a_malformed_body_is_refused_without_storing` |
| R2 | `…::test_a_valid_event_is_stored_once_and_answered_200`, `::test_processing_is_enqueued_after_the_commit_never_inside_the_request` |
| R3 | `…::test_a_received_payment_posts_one_credit_per_item_and_marks_the_document_paid` |
| R4 | `…::test_a_repeated_event_posts_nothing_twice` |
| R5 | `…::test_a_different_amount_goes_to_the_unprocessed_queue_and_posts_nothing` |
| R6 | `…::test_an_unmatched_payment_is_queued_with_its_reason` |
| R7 | `…::test_other_events_are_kept_and_ignored` |
| R8 | `…::test_a_refused_posting_leaves_nothing_posted` |
| R9 | `apps/billing/tests/test_automatic_billing_entry.py` (three tests) |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` and `docs/apps/finance.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Validation of the real webhook payloads against the Asaas sandbox (it needs a CNPJ sandbox account and a tunnel to this endpoint).
