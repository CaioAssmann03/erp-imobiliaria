---
summary: Spec 035 — e-mail the registered boleto to the payer (Resend): BillingDocumentDelivery, the retrying task, and the provider webhook that reports delivered or bounced.
read-when: you build or change the boleto e-mail, BillingDocumentDelivery, the Resend client or its webhook
skip-if: registering the charge → features/031-gateway-charge-registration.md; the screens that show the delivery → features/036-registration-payment-screens.md; the whole phase → roadmap/phase-5-billing-bank-integration/README.md
---
# 035 — E-mail delivery

**Status:** in-progress · **Level:** full · **Roadmap:** phase 5 part 06 · **Apps:** billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | Our own e-mail through Resend (Asaas notifications stay off), carrying a **link** to the boleto, the digitable line and the Pix copy-and-paste, never an attachment | the user (the part's recommendation) |
| 2026-10-22 | One `BillingDocumentDelivery` per registration and channel (a reissue is a new registration, so it is e-mailed again); the provider's idempotency key is the delivery id; only an unavailable provider is retried, every other failure is a `failed` delivery with a reason | agent, decided under the user's go-ahead to finish phase 5 (to review in the PR) |
| 2026-10-22 | The Resend webhook is verified with the Svix signature (`RESEND_WEBHOOK_SECRET`); `email.delivered` only moves a `sent` delivery, a bounce or complaint fails it, a failed delivery is never promoted | agent, decided under the user's go-ahead (to review in the PR) |
| 2026-10-22 | The e-mail text is Portuguese and lives in the backend (`infrastructure/rendering/delivery_email.py`), like the boleto PDF template | agent, decided under the user's go-ahead (to review in the PR) |

## R — Requirements
- [x] R1 — After a registration commits, the payer is e-mailed a link to the boleto, the digitable line and the Pix code; the sending never blocks the registration
- [x] R2 — A delivery is recorded as `sent` with the provider's message id and the destination
- [x] R3 — A repeat or a retry sends nothing twice (one delivery per registration and channel)
- [x] R4 — A payer without an e-mail, an unconfigured provider and a refusal are `failed` deliveries with a reason (`payer_without_email`, `email_not_configured`, `provider_rejected`); an unavailable provider is retried with backoff
- [x] R5 — The provider's webhook, authenticated by its signature (a missing, wrong or old one is refused), marks a delivery `delivered`, or `failed` with `bounced` / `complained`
- [x] R6 — The webhook never promotes a failed delivery
- [x] R7 — The documents API shows the latest delivery of the active registration (`delivery`)
- [x] R8 — Every value printed in the HTML e-mail is escaped

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `BillingDocumentDelivery` | new, `@final` | `document`, `registration`, `channel` (`email` now; `whatsapp`/`mail`/`portal` reserved), `status` `pending`/`sent`/`delivered`/`failed`, `destination`, `provider_message_id`, `sent_at`, `failure_reason`; unique (`registration`, `channel`); a sent or delivered one has a provider message id |

## A — Approach
`ResendClient` (`urllib3`; no new dependency) sends; `services/send_billing_document_email.py` decides; `tasks.send_billing_document_email_task` retries only `EmailUnavailable`; the registration service enqueues it on commit. Rejected: attaching the PDF (heavier, not trackable); Asaas's own e-mail (we could not control the text).

## S — Structure
`models/billing_document_delivery.py` + migration `0010`, `infrastructure/gateway/resend_client.py`, `infrastructure/gateway/svix_signature.py`, `infrastructure/rendering/delivery_email.py`, `services/send_billing_document_email.py`, `tasks.py`, `views/resend_webhook_views.py` (`POST /api/webhooks/resend/`), serializers (`delivery`), `admin.py`, `config/settings.py` (`RESEND_API_KEY`, `RESEND_FROM`, `RESEND_WEBHOOK_SECRET`), `.env.example`.

## O — Operations
1. Model and migration. 2. Client and signature check. 3. E-mail text and service. 4. Task and the enqueue. 5. Webhook. 6. Serializer, Admin. 7. Docs, client.

## N — Norms
The delivery rules (unique channel, provider id) are model constraints; the service holds none.

## S — Safeguards
- The API key is never in a message or a log; the Svix timestamp tolerance (5 minutes) blocks replays.
- A repeat of the task finds the delivery and stops; the provider's idempotency key covers a lost response.
- A bounce is recorded, not retried: the payer's address needs fixing by staff.
- Not validated against Resend: a real send, the webhook payload shape (`data.email_id`) and the signature with a real secret (needs a verified domain, an API key and the webhook secret).

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_billing_document_delivery.py::test_a_registration_enqueues_the_e_mail_after_the_commit`, `::test_the_boleto_is_sent_by_e_mail_with_a_link_and_the_digitable_line` |
| R2 | `…::test_the_boleto_is_sent_by_e_mail_with_a_link_and_the_digitable_line` |
| R3 | `…::test_a_repeat_sends_nothing_twice`, `…::test_an_unavailable_provider_raises_and_the_retry_sends_once` |
| R4 | `…::test_a_payer_without_e_mail_is_a_failed_delivery_with_a_reason`, `…::test_an_unconfigured_or_refusing_provider_fails_the_delivery`, `…::test_an_unavailable_provider_raises_and_the_retry_sends_once` |
| R5 | `…::test_delivered_and_bounced_events_update_the_delivery`, `…::test_an_unsigned_wrong_or_old_request_is_refused` |
| R6 | `…::test_delivered_and_bounced_events_update_the_delivery` |
| R7 | `…::test_the_documents_api_shows_the_delivery` |
| R8 | `…::test_the_e_mail_escapes_what_it_prints` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/billing.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated; index in `features/README.md` updated

## Pending before `done`
A real send and the webhook against Resend (needs a verified sending domain, `RESEND_API_KEY`, `RESEND_FROM` and `RESEND_WEBHOOK_SECRET`).
