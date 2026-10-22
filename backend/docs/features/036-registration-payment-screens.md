---
summary: Spec 036 — the document page shows the registered boleto, the payment and the e-mail delivery, and staff can reissue the boleto; the payment is added to the documents API.
read-when: you build or change what the billing document screens show about the gateway (boleto, payment, delivery) or the reissue action on the screen
skip-if: the reissue rules → features/034-overdue-handling-reissue.md; the e-mail → features/035-email-delivery.md; the frontend conventions → frontend/docs/README.md
---
# 036 — Registration and payment screens

**Status:** in-progress · **Level:** lite · **Roadmap:** phase 5 part 07 · **Apps:** billing, frontend · **Frontend impact:** new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | The unprocessed queue and the gateway account status stay in the Django Admin in this phase; no new screen | the user (the part's recommendation) |
| 2026-10-22 | The list already shows registered / paid through the status badge and its status filter, so it gets no new column; the document page gets a **Boleto** section | agent, decided under the user's go-ahead to finish phase 5 (to review in the PR) |
| 2026-10-22 | The API gains `payment` (`paid_on`, `amount`, `net_amount`) on the documents, since the page shows when and how much was paid | agent, decided under the user's go-ahead (to review in the PR) |

## What
- **Backend:** `billing-documents` carry `payment` (null until paid), read only (`BillingDocumentPaymentSerializer`; `select_related("payment")`).
- **Document page** (`billing/documents/[id]`), a Server Component section `BillingDocumentBoleto`:
  - waiting (issued): "ainda não registrado no gateway"; cancelled by the gateway (registered without an active registration): a warning to reissue;
  - active or paid: the boleto due date, the link to the boleto (only if `https`, opened in a new tab with `rel="noopener noreferrer"`), the digitable line and, while payable, the Pix copy-and-paste, each with a **Copiar** button (`components/CopyButton.tsx`);
  - paid: the payment date, the amount and the net amount after the gateway fee;
  - the e-mail: status (Aguardando envio, Enviado, Entregue, Falhou with the reason in Portuguese), the destination and when.
- **Reissue** (`ReissueBillingDocumentDialog`, in `BillingDocumentActions`, only for a registered document): asks the new due date (default in 3 days) and calls `POST /api/billing-documents/{id}/reissue/`; the server's refusals show on the field or as a toast.
- `lib/billing-documents.ts`: `boletoState`, `canReissueDocument`, the delivery labels; `lib/schemas/billing-document.ts`; the new error codes are translated in `lib/error-messages.ts`; the new problem codes in `lib/billing-run-problems.ts`.

## Acceptance
- [x] A1 — The page shows the boleto section according to the state (waiting, active, cancelled, paid) and nothing for a cancelled document
- [x] A2 — The digitable line and the Pix code can be copied; the boleto link opens only when it is `https`
- [x] A3 — A paid document shows its payment date, amount and net amount; a document with a delivery shows its status, destination and reason
- [x] A4 — A registered document offers "Reemitir boleto"; the dialog sends the new due date and refreshes the page; a document in another status does not offer it
- [x] A5 — The documents API carries `payment`

## Tests
| Criterion | Test |
|---|---|
| A1, A4 | `frontend/tests/billing-boleto.test.mjs` (`boletoState`, `canReissueDocument`) |
| A3 | `frontend/tests/billing-boleto.test.mjs` (delivery labels) |
| A5 | `backend/apps/billing/tests/test_gateway_webhook.py::test_the_documents_api_shows_the_payment` |
| A2 | none automated (a rendering detail, checked by hand on a phone-width screenshot): a gap written down |

## Done
- [x] Tests green; `tsc`, `eslint` and the build clean; client regenerated
- [x] `docs/apps/billing.md`, `frontend/docs/entities/domain-model.md`, roadmap part and phase, index updated
