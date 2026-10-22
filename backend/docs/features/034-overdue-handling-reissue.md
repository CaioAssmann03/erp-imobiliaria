---
summary: Spec 034 — overdue handling with Asaas: a manual reissue of a registered document's boleto, and the gateway's cancellation and refund events.
read-when: you build or change the reissue action, the cancelled registration status or how cancellation and refund events are handled
skip-if: the first registration → features/031-gateway-charge-registration.md; the payment event → features/032-payment-webhook.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 034 — Overdue handling and reissue

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 05 · **Apps:** billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | No automatic reissue and no beat task: Asaas applies the fine and interest itself while the registration lives (its lifetime is set long at creation, spec 031). Only a **manual reissue** by staff | the user (the part's recommendation) |
| 2026-10-22 | No monetary correction (not modeled) | the user (the part's recommendation) |
| 2026-10-22 | The reissue creates a new charge (a new reference `<document id>:<n>`), marks the old registration `replaced` and then cancels the old charge at the gateway; if that cancellation fails the old registration is flagged `old_charge_not_cancelled` and a payment of it reaches the unprocessed queue. The document amount is not recalculated | agent, decided under the user's go-ahead to finish phase 5 (to review in the PR) |
| 2026-10-22 | `PAYMENT_BANK_SLIP_CANCELLED` and `PAYMENT_DELETED` mark the active registration `cancelled` (the document stays `registered`, the API shows no active registration); `PAYMENT_REFUNDED` of a paid document goes to the unprocessed queue (staff reverses the ledger entries) | agent, decided under the user's go-ahead (to review in the PR) |

## R — Requirements
- [x] R1 — A staff member can reissue a `registered` document with an active or cancelled registration, giving the new due date; the new registration is `active` with the reason `reissue` and the old one `replaced`; nothing is deleted
- [x] R2 — The old charge is cancelled at the gateway after the new one exists; a failure to cancel it is recorded on the old registration
- [x] R3 — A refusal of the new charge is kept as a `failed` `reissue` registration and the current registration stays; a gateway outage changes nothing and is reported as unavailable (503)
- [x] R4 — The reissue is refused for a document that is not `registered`, without a registration to replace, without an active gateway account or payer document, or with a due date in the past
- [x] R5 — A cancellation event marks the active registration `cancelled`; the event our own reissue causes (for a replaced registration) is ignored
- [x] R6 — A refund of a paid document goes to the unprocessed queue with `payment_refunded`; a refund of anything else is ignored
- [x] R7 — `POST /api/billing-documents/{id}/reissue/` takes `due_date` and answers the document with its new `registration`
- [x] R8 — The second copy of a boleto is the active registration's `boleto_url`: no new charge

## E — Entities
`BillingDocumentRegistration`: status `cancelled` (migration `0009`) and a rule on a new reissue: `registered_due_date` not before today (`billing_document_registration.registered_due_date.in_past`).

## A — Approach
`services/reissue_billing_document.py` reuses the registration helpers (`gateway/charges.py`, shared with spec 031). Create new, then replace, then cancel old: a failure at any step never leaves the document without a payable charge.

## S — Structure
`services/reissue_billing_document.py`, `gateway/charges.py`, `services/process_gateway_event.py` (cancellation, refund), `views/billing_document_views.py` (`reissue` action, `GatewayNotAvailable` 503), `serializers/…` (`BillingDocumentReissueSerializer`), `gateway/asaas_client.py` (`delete_payment`), `errors/billing_document_registration.py`.

## O — Operations
1. Status, rule, migration. 2. Shared helpers and the reissue service. 3. Events. 4. Action. 5. Docs and client.

## N — Norms
The due-date rule lives in the model; the serializer only parses the date.

## S — Safeguards
- Two payable charges can exist briefly (new created, old not yet cancelled): the old one's payment is `charge_not_active` in the queue, never posted twice.
- A reissue of a document already paid is refused (the gateway also refuses to delete a paid charge).
- Not validated against the sandbox: whether `DELETE /payments/{id}` answers as assumed and whether `PAYMENT_DELETED` is sent.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_reissue_billing_document.py::test_a_reissue_replaces_the_registration_and_cancels_the_old_charge`, `::test_a_cancelled_registration_can_be_reissued_without_cancelling_anything` |
| R2 | `…::test_a_failure_to_cancel_the_old_charge_is_recorded` |
| R3 | `…::test_a_refused_new_charge_keeps_the_current_registration`, `…::test_a_gateway_outage_changes_nothing` |
| R4 | `…::test_the_reissue_is_refused` |
| R5 | `…::test_a_cancellation_marks_the_active_registration`, `…::test_the_cancellation_our_own_reissue_causes_is_ignored` |
| R6 | `…::test_a_refund_of_a_paid_document_goes_to_staff` |
| R7 | `…::test_the_reissue_action`, `…::test_the_reissue_action_reports_its_refusals` |
| R8 | none needed: it is the existing `registration.boleto_url` (spec 031, R9) |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
Validation against the Asaas sandbox (the delete call and the cancellation events; needs a CNPJ sandbox account).
