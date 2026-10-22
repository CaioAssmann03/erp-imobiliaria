---
summary: Phase 5 (Billing issuance (gateway)) of the roadmap — goal, parts, status and the decisions to take before it starts. The folder keeps its old name.
read-when: you plan or start work belonging to phase 5: registering charges at the Asaas gateway, payments, overdue handling and delivery
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 5 — Billing issuance (gateway)

**Status:** in-progress · **Source:** Sprint 5 of the sprints PDF, revised on 2026-10-21 for the Asaas gateway · **Depends on:** phase 4

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
| 01 | [Gateway accounts](01-gateway-accounts.md) | in-progress | billing |
| 02 | [Charge registration](02-gateway-charge-registration.md) | in-progress | billing |
| 03 | [Payment webhook and ledger posting](03-payment-webhook.md) | in-progress | billing, finance |
| 04 | [Daily reconciliation](04-daily-reconciliation.md) | in-progress | billing, finance |
| 05 | [Overdue handling](05-overdue-handling.md) | in-progress | billing |
| 06 | [E-mail delivery](06-email-delivery.md) | in-progress | billing |
| 07 | [Registration and payment screens](07-registration-payment-screens.md) | in-progress | frontend |

## What the Asaas documentation says (checked on 2026-10-21, two passes)
Read from docs.asaas.com and the public Asaas pages; fees and limits change, so recheck before a spec depends on them. Some help-center pages answered 403 and could not be read. **Not found** means the pages read did not say.
| Topic | Finding |
|---|---|
| Sub-accounts | `POST /v3/accounts` creates one and returns its **API key, shown only once**, and its `walletId`. The parent must be a legal entity (CNPJ). Required: name, e-mail, `cpfCnpj`, `incomeValue`, `companyType`, phones, address, postal code. **Customers and charges belong to the sub-account** that creates them. A lost key is reissued with `POST /v3/accounts/{id}/accessTokens` (parent key, IP whitelist, option enabled in the web UI) |
| Sub-account approval | Non-BaaS: the holder gets an activation e-mail and sends documents in the Asaas interface; BaaS: the platform guides the holder through an `onboardingUrl` or the API. Documents: an identification document and a selfie of the holder or representative; associations may need the election minutes. Status: `GET /v3/myAccount/status`, webhook `ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED` (`APPROVED` when general). **Not found:** rejection handling, timelines, whether a sub-account can receive charges before approval |
| **Evaluation period** | The first sub-account created in production starts it: **up to 10 sub-accounts, R$ 2,000.00 in charges per sub-account (individual; deleted unpaid charges give the limit back, refunded ones do not) and 60 days**. Hitting a limit blocks new sub-accounts and new charges, subscriptions and payment links for that sub-account; charges already issued can still be paid and the balance is not blocked. **It ends with the regulatory homologation, which can be requested at any time, without waiting for the 60 days or the limits**; after approval the limits stop. In the sandbox the period is on by default and can be turned off in the sandbox account; sandbox sub-accounts are not copied to production. **Not found:** what the review requires and how long it takes |
| BaaS | Must be agreed and set up with the account manager; creating sub-accounts by API alone does not make them BaaS. After the evaluation period, managing sub-account API keys requires BaaS or branch sub-accounts sharing the parent's CNPJ prefix. **Not found:** unrelated CNPJs, limits, costs |
| Fees | Public pages: **R$ 0.99 per received boleto or Pix for the first three months, R$ 1.99 afterwards**; issuing is free. **Creating a sub-account carries a fixed fee debited from the parent's balance right after creation, whatever the approval** (a non-BaaS sub-account closed within 48 hours without a login is not charged); the amount is in the account's fees page, and the terms mention a daily calculation by the number of open sub-accounts. A monthly fee exists only for the optional Escrow account |
| Split | **The terms forbid configuring a split over the full value of a charge issued in a sub-account**: it is for the account's legitimate remuneration only (clause 7.3), and the user must have a formal contract with every split beneficiary (7.5). A split is calculated on the net value (after the Asaas fee). So a single company account that splits everything to the condominiums is **not** an allowed design |
| Customers | Only `name` and `cpfCnpj` are required; e-mail is optional; `notificationDisabled: true` (at creation or on update) turns off Asaas's billing notifications; `externalReference` is our own id. **The API allows duplicate customers**: look one up before creating it, and check again after a timeout |
| Charge fields | `POST /v3/payments`, `billingType: BOLETO`; `discount {value, dueDateLimitDays (days before the due date; 0 = until it), type FIXED/PERCENTAGE}`; `interest {value}` = **percentage per month**; `fine {value, type FIXED/PERCENTAGE}`; `externalReference`; `daysAfterDueDateToRegistrationCancellation` (boleto only, up to 3650 business days, **cannot be changed after creation**, 0 cancels when it becomes overdue; **the account default is not stated**) |
| Boleto data | The creation response has `bankSlipUrl` (the boleto PDF) and `invoiceUrl`. `GET /v3/payments/{id}/identificationField` gives the digitable line, barcode and `nossoNumero`. `GET /v3/payments/{id}/pixQrCode` gives `encodedImage` (base64), `payload` (copy and paste) and `expirationDate` for BOLETO charges too. **Without a registered Pix key** the QR is tied to a partner institution and payable only until 23:59 of the same day, and the boleto PDF shows no Pix QR. After a change to the charge, fetch the digitable line and the QR again |
| Updating a charge | `PUT /v3/payments/{id}` needs `billingType`, `value` and `dueDate`; allowed while waiting for payment or overdue; the customer cannot change; a change fires `PAYMENT_UPDATED`. **Not found:** whether it registers the boleto again or changes `bankSlipUrl` |
| Fine and interest | Asaas "calculates the additions automatically" from the charge's terms. **Not found:** whether the monthly interest is pro rata per day or the full month, a grace period, a different fine for the first days. A due date on a weekend or holiday paid on the next business day carries no fine or interest (not for Pix) |
| After the due date | Paying an overdue boleto depends on the issuer accepting post-due payment. The registration is **cancelled automatically** after `daysAfterDueDateToRegistrationCancellation` business days, announced by `PAYMENT_BANK_SLIP_CANCELLED` (the charge still exists). **Not found:** how to revive it |
| Webhooks | Events include `PAYMENT_CREATED/UPDATED/CONFIRMED/RECEIVED/OVERDUE/DELETED/REFUNDED/BANK_SLIP_CANCELLED`. `CONFIRMED` = paid, balance not yet available; `RECEIVED` = amount available (a boleto goes CONFIRMED then RECEIVED; Pix straight to RECEIVED). Payload: `id` (`evt_…`), `event`, `dateCreated`, `account`, `payment` (`id`, `value`, `netValue`, `dueDate`, `paymentDate`, `externalReference`, `bankSlipUrl`, `fine`, `interest`, `discount`; `originalValue` when the paid amount differs); unknown fields must be ignored. Authentication: the `asaas-access-token` header carries the `authToken` (32–255 characters, returned only at creation). Configured **per account**; a sub-account's can be set at its creation (`webhooks` field) |
| Webhook delivery | **At least once**, no ordering guarantee: persist the event `id`, answer 200 and process afterwards. A non-2xx answer is retried; **after 15 consecutive failures the queue is paused**; paused events are kept **14 days** and then deleted |
| API limits | **25,000 requests per account every 12 hours** (it can be raised for legitimate charge volume, not for polling), **50 concurrent GETs**, and per-endpoint rate limits (not customizable). `429` carries `RateLimit-Limit/Remaining/Reset`; wait for `RateLimit-Reset`, never retry at once. Polling status is discouraged in favor of webhooks |
| Sandbox | `POST /v3/sandbox/payment/{id}/confirm` (or a button) confirms a charge and fires the webhooks; real boletos are not recognized; a Pix QR needs a Pix key in the sandbox account; 20 sub-accounts a day |
| Not found | Pro rata interest, the first-days fine, the default registration-cancellation window, reviving a cancelled registration, homologation requirements and timeline, BaaS for unrelated CNPJs |

## Decisions (proposed from the documentation; confirm or change)
Everything below was decided by the agent on 2026-10-21 from the public documentation alone, because the user chose not to contact Asaas now. A residual unknown is a **risk to validate in the sandbox or at production onboarding**, not a blocker to specifying.
| # | Decision | Proposed | Affects | Risk still open |
|---|---|---|---|---|
| 1 | How the money reaches each condominium | **A sub-account per condominium**, the beneficiary of its own boletos (the only model the documentation supports: customers and charges belong to the sub-account, and a full-value split is forbidden). The **homologation is requested before go-live** (it can be requested at any time; the R$ 2,000.00 limit per sub-account is below one condominium's monthly charges); the sandbox period is turned off for development | 01, 02 | how long the homologation takes and what it asks; whether unrelated condominium CNPJs are accepted outside BaaS; the creation fee per condominium; each síndico does the KYC |
| 2 | The official boleto | the Asaas hosted boleto (`bankSlipUrl`) plus our PDF as the statement of items; a **Pix key registered** in each sub-account so the QR shows and lasts | 02, 06, 07 | whether the key registration can be done by API |
| 3 | Fine, interest and discount | send what maps: fine (percentage), interest (monthly percentage), discount (percentage and the days). The first-days fine, the grace period and `interest_calculation` stay as data **without effect on gateway charges**, and the condominium screen says so | 02, 05, 07 | how Asaas counts the interest |
| 4 | How payments reach us | webhook stored first and processed afterwards, plus the daily reconciliation (it covers the 14-day deletion and the paused queue); no status polling (it spends the 25,000-request quota) | 03, 04 | none |
| 5 | A payer without CPF/CNPJ | not a gateway customer: the issuance records `payer_without_document` and skips the unit | 02 | none |
| 6 | Boleto delivery | our e-mail with a link (Resend); the customer is created with `notificationDisabled: true` | 06 | none |
| 7 | Fee per charge | R$ 0.99 for three months, then R$ 1.99 (public pages) plus the sub-account creation fee, to be compared with the old convenio using the contract in the account | 01 | the contract values |
| 8 | Registration lifetime | set `daysAfterDueDateToRegistrationCancellation` explicitly and long (a setting, default 60 business days) since it cannot change afterwards | 02, 05 | the account default; reviving a cancelled boleto |
| 9 | The event that marks paid and posts the ledger | `PAYMENT_RECEIVED` (money available); `CONFIRMED` only shown as "em processamento" | 03 | none |
| 10 | Customers | looked up by `externalReference` (the person's id) and, failing that, by `cpfCnpj` before creating; created once per (person, sub-account) | 02 | none |

## Notes
- Local development uses the Asaas **sandbox** (`ASAAS_BASE_URL`, `ASAAS_API_KEY`); it cannot reach `localhost`, so webhooks need a tunnel or the VPS. The sandbox can confirm a charge through the API, which fires the webhooks, so the whole flow is testable without real money.
- Going live needs a production account in the CNPJ of the company or of each condominium, never a personal account (part 01).
- Part 07 is the frontend counterpart: the registration, payment status, digitable line and Pix copy-paste on the documents screens.

## Sources
[Sub-account creation](https://docs.asaas.com/docs/criacao-de-subcontas) · [Boleto charges](https://docs.asaas.com/docs/cobrancas-via-boleto) · [Create a charge](https://docs.asaas.com/reference/criar-nova-cobranca) · [Payment events](https://docs.asaas.com/docs/webhook-para-cobrancas) · [Webhook idempotency](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks) · [Webhooks introduction](https://docs.asaas.com/docs/sobre-os-webhooks) · [Overdue boleto cancellation event](https://docs.asaas.com/changelog/webhook-para-cancelamento-de-boletos-vencidos) · [Sandbox: confirm payment](https://docs.asaas.com/reference/confirmar-pagamento) · [Split FAQ](https://docs.asaas.com/docs/duvidas-frequentes-split) · [Prices and fees](https://www.asaas.com/precos-e-taxas) · [Evaluation period FAQ](https://docs.asaas.com/docs/faq-periodo-de-avaliacao) · [Sub-account approval flow](https://docs.asaas.com/docs/detalhamento-do-fluxo-de-aprova%C3%A7%C3%A3o-de-subcontas) · [BaaS](https://docs.asaas.com/docs/sobre-baas) · [Update a charge](https://docs.asaas.com/reference/atualizar-cobranca-existente) · [Create a customer](https://docs.asaas.com/reference/criar-novo-cliente) · [Pix QR code of a charge](https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix) · [API limits](https://docs.asaas.com/reference/rate-e-quota-limit)

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
