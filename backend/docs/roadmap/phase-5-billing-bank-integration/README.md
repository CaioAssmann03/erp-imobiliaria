---
summary: Phase 5 (Billing issuance (gateway)) of the roadmap — goal, parts, status and the decisions to take before it starts. The folder keeps its old name.
read-when: you plan or start work belonging to phase 5: registering charges at the Asaas gateway, payments, overdue handling and delivery
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 5 — Billing issuance (gateway)

**Status:** todo · **Source:** Sprint 5 of the sprints PDF, revised on 2026-10-21 for the Asaas gateway · **Depends on:** phase 4

## Goal
Register each issued document as a charge at Asaas (boleto with Pix), learn about payments by webhook and post them to the ledger, handle overdue charges, deliver the boleto by e-mail and show all of it on the Cobrança screens.

## Revision (2026-10-21)
The first plan integrated Santander directly (certificate, OAuth, remittance and return files, our own reissue of overdue boletos). The company's bank account is not available for now, so a ready gateway replaced it (phase 4 part 01). What changes:
| Before (Santander) | Now (Asaas) |
|---|---|
| Certificate + OAuth, our `httpx` client | An API key per account; our `httpx` client |
| `BankSlipRegistration` with our number, barcode, digitable line | The same facts (and the gateway's payment id and boleto URL) come back from Asaas |
| Daily polling of the bank return | **Webhooks** for payments, plus a daily reconciliation as the safety net |
| We reissue an overdue boleto with fine and interest at that date | Fine, interest and discount are sent to Asaas with the charge and it applies them; reissue becomes the exception (part 05) |
| Tolerance margin on the amount paid | The gateway charges an exact amount; the margin shrinks to a check (part 03) |
| One bank convenio | One **sub-account per condominium** as the beneficiary (to confirm, below) |

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Gateway accounts](01-gateway-accounts.md) | todo | billing |
| 02 | [Charge registration](02-gateway-charge-registration.md) | todo | billing |
| 03 | [Payment webhook and ledger posting](03-payment-webhook.md) | todo | billing, finance |
| 04 | [Daily reconciliation](04-daily-reconciliation.md) | todo | billing, finance |
| 05 | [Overdue handling](05-overdue-handling.md) | todo | billing |
| 06 | [E-mail delivery](06-email-delivery.md) | todo | billing |
| 07 | [Registration and payment screens](07-registration-payment-screens.md) | todo | frontend |

## What the Asaas documentation says (checked on 2026-10-21)
Read from docs.asaas.com and the Asaas help center on that date; fees and limits change, so recheck before a spec depends on them. **Confirmed** means the page says it; **Not found** means the pages read did not answer it (ask Asaas or look in the account).
| Topic | Finding |
|---|---|
| Sub-accounts | `POST /v3/accounts` creates one and returns its **API key, shown only once**, and its `walletId`. The parent must be a legal entity (CNPJ). Required: name, e-mail, `cpfCnpj`, `incomeValue`, `companyType`, phones, address, postal code. The holder gets an activation e-mail and sends documents (KYC per condominium). A lost key is reissued with `POST /v3/accounts/{id}/accessTokens` (needs the parent key, the IP whitelist and the option enabled in the web UI). Creating sub-accounts may carry fees (account settings > fees). Sandbox: 20 sub-accounts a day |
| **Evaluation period (blocker)** | The first sub-account created in production starts a regulatory period: **at most 10 sub-accounts, R$ 2,000.00 in charges per sub-account and 60 days**; after a limit is reached, creating sub-accounts and issuing charges is **blocked until Asaas finishes the review**. To keep using sub-account API keys afterwards the operation must fit Asaas's **BaaS** or be branch sub-accounts **sharing the parent's CNPJ prefix** (condominiums have unrelated CNPJs). Homologation can be requested during the period |
| Charge fields | `POST /v3/payments`, `billingType: BOLETO`, `customer`, `value`, `dueDate`; `discount {value, dueDateLimitDays (days before the due date; 0 = until the due date), type FIXED/PERCENTAGE}`; `interest {value}` = **percentage per month** after the due date; `fine {value, type FIXED/PERCENTAGE}`; `externalReference` (free, searchable); `daysAfterDueDateToRegistrationCancellation` (boleto only, up to 3650, **cannot be changed after creation**; 0 cancels the registration when it becomes overdue; omitted = the account default, **its value was not found**) |
| Boleto data | The creation response has `bankSlipUrl` (the boleto PDF) and `invoiceUrl`. `GET /v3/payments/{id}/identificationField` gives the digitable line, the barcode and the `nossoNumero`; fetch it again after a value or due-date change. The boleto PDF shows a **Pix QR code** only if the Asaas account has a **Pix key registered** |
| Fine and interest | Asaas "calculates the additions automatically" from the charge's terms. **Not found:** whether interest is pro rata per day or the full month, any grace period, any different fine for the first days. A due date on a weekend or holiday paid on the next business day carries no fine or interest (not for Pix) |
| After the due date | Paying an overdue boleto depends on the issuer accepting post-due payment. The registration is **cancelled automatically** `daysAfterDueDateToRegistrationCancellation` business days after the due date, announced by `PAYMENT_BANK_SLIP_CANCELLED` (the charge still exists). **Not found:** what happens to a payment after that cancellation, and how to revive the charge |
| Webhooks | Events include `PAYMENT_CREATED/UPDATED/CONFIRMED/RECEIVED/OVERDUE/DELETED/REFUNDED/BANK_SLIP_CANCELLED`. `CONFIRMED` = paid, balance not yet available; `RECEIVED` = amount available (a boleto goes CONFIRMED then RECEIVED; Pix goes straight to RECEIVED). Payload: top-level `id` (`evt_…`), `event`, `dateCreated`, `account`, `payment` (`id`, `value`, `netValue`, `dueDate`, `paymentDate`, `externalReference`, `bankSlipUrl`, `fine`, `interest`, `discount`; `originalValue` when the paid amount differs); unknown fields must be ignored. Authentication: the `asaas-access-token` header carries the `authToken` (32–255 characters, returned only at creation) |
| Webhook delivery | **At least once**, no ordering guarantee: use the event `id` as the unique key, store it, answer 200 and process afterwards (Asaas's own recommendation). A non-2xx answer is retried; **after 15 consecutive failures the queue is paused**; paused events are kept **14 days** and then deleted. Webhooks are configured **per account** (a sub-account has its own) |
| Sandbox | `POST /v3/sandbox/payment/{id}/confirm` (or a button) confirms a charge and fires the webhooks; real boletos are not recognized there |
| Fees | Public pages: **R$ 0.99 per received boleto or Pix for the first three months, R$ 1.99 afterwards**; issuing is free and the fee is charged only on payment. The contract shown in the account is what counts |
| Split | Computed on the **net value** (after Asaas's fee); each receiver needs a `walletId` (that is, a sub-account); what is not split stays with the issuing account |
| Not found | Rate limits, how to turn off the customer's Asaas notifications, how a Pix QR is fetched for a charge, whether the interest is capped, and the exact default of the registration-cancellation window |

## Decisions to take before the phase starts
Each has a recommendation; none is decided yet.
| # | Decision | Recommended | Affects |
|---|---|---|---|
| 1 | **How the money reaches each condominium.** A sub-account per condominium (boleto beneficiary = the condominium, as on the real Santander boleto) hits the evaluation period and needs BaaS; the split also needs one sub-account per receiver | **Before any code, ask Asaas in writing**: can a CNPJ-parent company onboard dozens of unrelated condominium CNPJs, under BaaS or a negotiated homologation, with what limits and fees? If the answer is no, the alternatives are one company account that transfers to the condominiums (the company is the boleto beneficiary, with legal and accounting consequences to check with the client) or the direct bank convenio again | 01, 02 |
| 2 | The official boleto: the Asaas hosted boleto or our own PDF with a generated barcode | the Asaas boleto (`bankSlipUrl`); our PDF stays as the statement of items. A Pix key must be registered for the QR to show | 02, 06, 07 |
| 3 | Fine, interest and discount: the gateway supports one fine percentage, one monthly interest percentage and one discount; our rules also have a first-days fine tier, a grace period and `full_month` vs `per_day` interest | send what maps (fine, monthly interest, discount) and decide with the user what to do with the rest: drop the tier and the grace period for gateway charges, or keep them as data without effect. Ask Asaas how its interest is counted | 02, 05 |
| 4 | How payments reach us | webhook stored first and processed afterwards (as Asaas recommends), plus the daily reconciliation, which also covers the 14-day deletion and the paused queue | 03, 04 |
| 5 | A payer without CPF/CNPJ cannot be a gateway customer | the issuance records a new problem code (`payer_without_document`) and skips the unit | 02 |
| 6 | Boleto delivery | our e-mail with a link (Resend); find out how to turn off Asaas's own notifications | 06 |
| 7 | The fee per charge against the old convenio (volume is high) | compare with the contract shown in the account before opening production | 01 |
| 8 | How long an unpaid boleto stays registered | set `daysAfterDueDateToRegistrationCancellation` long at creation (it cannot change later) and learn what the account default is | 02, 05 |
| 9 | The event that marks the document paid and posts the ledger | `PAYMENT_RECEIVED` (the money is available); show `CONFIRMED` as "pagamento em processamento" if useful | 03 |

## Notes
- Local development uses the Asaas **sandbox** (`ASAAS_BASE_URL`, `ASAAS_API_KEY`); it cannot reach `localhost`, so webhooks need a tunnel or the VPS. The sandbox can confirm a charge through the API, which fires the webhooks, so the whole flow is testable without real money.
- Going live needs a production account in the CNPJ of the company or of each condominium, never a personal account (part 01).
- Part 07 is the frontend counterpart: the registration, payment status, digitable line and Pix copy-paste on the documents screens.

## Sources
[Sub-account creation](https://docs.asaas.com/docs/criacao-de-subcontas) · [Boleto charges](https://docs.asaas.com/docs/cobrancas-via-boleto) · [Create a charge](https://docs.asaas.com/reference/criar-nova-cobranca) · [Payment events](https://docs.asaas.com/docs/webhook-para-cobrancas) · [Webhook idempotency](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks) · [Webhooks introduction](https://docs.asaas.com/docs/sobre-os-webhooks) · [Overdue boleto cancellation event](https://docs.asaas.com/changelog/webhook-para-cancelamento-de-boletos-vencidos) · [Sandbox: confirm payment](https://docs.asaas.com/reference/confirmar-pagamento) · [Split FAQ](https://docs.asaas.com/docs/duvidas-frequentes-split) · [Prices and fees](https://www.asaas.com/precos-e-taxas)

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
