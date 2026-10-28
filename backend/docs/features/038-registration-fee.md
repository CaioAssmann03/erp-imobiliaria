---
summary: Spec 038 — the bank registration fee (tarifa de registro) is a boleto line credited to the administradora's own ledger, never to a condominium.
read-when: you build or change the registration fee line of a boleto, the administradora's own ledger or how a payment splits between a condominium and the administradora
skip-if: the single gateway account → features/037-single-gateway-account.md; the payment posting → features/032-payment-webhook.md; the ledger of a condominium → apps/finance.md
---
# 038 — Registration fee (tarifa de registro)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** billing, finance · **Frontend impact:** new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-27 | The fee is credited to an account **of the administradora in the system**, never to a condominium's current account | the user |
| 2026-10-27 | **Who sets the amount:** the administradora, when it launches the charges of the condominiums' boletos (as a launch, see the first question), not a fixed company setting | the user |
| 2026-10-27 | The real cost of the gateway (R$ 1.20) **is not shown in the system**; it is internal | the user |
| 2026-10-27 | **No discount** applies to the fee | the user |
| 2026-10-27 | The fee **is detailed on the boleto** as its own line | the user |
| 2026-10-27 | A **second copy** (*segunda via*) of a boleto charges **the same fee**, never twice: one fee per document, whatever the number of registrations | the user |
| 2026-10-26 | The administradora always charges a bank registration fee on the boleto and defines its amount (for example R$ 3.90, while the gateway charges it R$ 1.20 per registration) | the user |
| 2026-10-26 | The fee must **never** be credited to the condominium's accounts | the user |
| 2026-10-26 | Spec 037 ships without a fee: the documents carry only items, and a payment credits only items, so nothing wrong can reach a condominium meanwhile | agent |
| 2026-10-27 | **The fee is a launch** with an event marked "receita da imobiliária" (`BillingEvent.credits_company`, e.g. 0005 TARIFA BANCO): it has **no sub-conta**, and its money is credited to the administradora's own ledger, never to a condominium | the user ("está certo") |
| 2026-10-27 | **Payment at the administradora's counter** (*pagamento na ADM sem taxa banco*, the administradora has a cash desk): **not built now, left for later** | the user |
| 2026-10-27 | **The fee is part of the base of the multa and the interest** (the 4,04 of the example boleto comes from an error in the old system's interest calculation, not from a rule); only the early-payment **discount** leaves the fee out | the user |
| 2026-10-27 | **How a line prints:** every line opens with the event code in four digits, a dash and the event name (`0005-TARIFA BANCO`), then the description; a **plan item may name an event** too | "as you prefer" (agent) |

## Example sent by the user (2026-10-27)
A Santander boleto issued in the administradora's own name (beneficiary EVE ADM DE IMOVEIS COND E VENDAS), competence SET/2026, due 10/10/2026, unit "Apto 103", "SÉRIE: 195 REGISTRO: 6518". Lines: `0005-TARIFA BANCO 3,90`, `2772-PINTURA FACHADA 30,00`, `0052-CONDOMINIO 170,00`; `TOTAL ATÉ 10/10/2026 203,90`; `MULTA APÓS 10/10/2026 4,04`; `TOTAL C/MULTA APÓS 10/10/2026 207,94`; `PAGAMENTO NA ADM. SEM TAXA BANCO ATÉ 10/10/2026 200,00`; "APÓS VENCIMENTO ACRESCER CORREÇÃO MONETÁRIA, JUROS DE 1% A.M E MULTA DE 2%".

## R — Requirements
A boleto total is the sum of its lines. A line can credit a condominium's sub-conta or the administradora itself (the fee). When the boleto is paid, each line is credited where it belongs, in one transaction.
- [x] R1 — `BillingEvent.credits_company` marks the events of money that belongs to the administradora; a launch with such an event has **no sub-conta** (and no entry template), and any other launch needs one
- [x] R2 — The document line made from it has no cost center and no entry template and `credits_company` true; every other line has both (a database constraint)
- [x] R3 — A paid document credits the company lines to `CompanyEntry` (one per line, the administradora's own ledger) and the others to the condominium's current account; **nothing of the fee ever reaches a condominium**
- [x] R4 — A `CompanyEntry` is immutable (no update, no delete) and unique per document line
- [x] R5 — The early-payment discount is computed over the lines of the condominium only: with a fee on the boleto it is sent to the gateway as a fixed amount over the rest; without a fee it stays a percentage. The multa and the interest are over the whole boleto, the fee included
- [x] R6 — The fee is its own line on the boleto (the PDF lists every line; its discount sentence says "sobre o valor sem a tarifa" when there is a fee)
- [x] R7 — A second copy (reissue) of a boleto charges the same fee: the document keeps its lines, so the fee is **one per document**, whatever the number of registrations
- [x] R8 — Every launch line opens with `<code in 4 digits>-<event name>` and then the description; a **plan item** may name an event (an item needs an event or a description, and never an event of the administradora)
- [x] R9 — The administradora's ledger can be read: `GET /company-entries/` (filter by date, search) and `GET /company-entries/balance/`, company-scoped, and a screen **Financeiro → Conta da imobiliária**

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `BillingEvent` | changed | `credits_company` boolean, default false |
| `BillingEntry` | changed | `cost_center` nullable: required unless the event credits the company, refused when it does (`BillingEntryRules`) |
| `BillingDocumentItem` | changed | `cost_center` and `entry_template` nullable, `credits_company` boolean; constraint: both empty and `credits_company`, or both set and not |
| `BillingPlanItem` | changed | `event` nullable; `description` may be blank when there is an event; rules: event or description, event of the company, never an event of the administradora |
| `CompanyEntry` (*LançamentoEmpresa*) | new, `@final`, finance | `company`, `billing_document_item` OneToOne, `entry_date`, `amount` positive, `description`; no balance cache (summed) |

## A — Approach
- The fee reuses the launch (spec 039): same screen, same rateio and recurrence; only the event decides where the money goes, so the staff keeps working as today and a condominium can never receive the fee by a wrong choice of sub-conta (there is none to choose).
- `post_billing_document_payment` splits the lines: the condominium lines go to `post_entries` as before, the company lines become `CompanyEntry` rows. The condominium ledger code is untouched.
- The discount is a fixed amount at the gateway when a fee exists because the gateway applies a percentage to the whole value (`infrastructure/gateway/charges.py::_discount`).
- Rejected: a company setting for the amount (the user sets it when launching); the fee as a field of the document (it would not be a line, the PDF and the gateway value would need special cases); reusing the condominium's current account with a special sub-conta (it is the thing that must never happen).

## S — Structure
- billing: `models/billing_event.py`, `billing_entry.py`, `billing_document_item.py`, `billing_plan_item.py`, `models/rules/billing_entry.py`, `billing_document_item.py`, `billing_plan_item.py`, `billing_document.py` (`fee_amount`, `discountable_amount`), `services/post_billing_document_payment.py`, `create_billing_document.py`, `issue_condominium_billing.py`, `infrastructure/gateway/charges.py`, `infrastructure/rendering/boleto_template.py`, serializers of events, entries, plan items and documents; migration `billing.0016`.
- finance: `models/company_entry.py`, `errors/company_entry.py`, `serializers/company_entry_serializers.py`, `views/company_entry_views.py`, Admin (read-only), audit; migration `finance.0015`.
- frontend: the **Receita da imobiliária** checkbox of the event form, the entry form hiding the sub-conta (destination "Conta da imobiliária"), `app/(dashboard)/finance/company-account/`, the Evento field of a plan item.

## O — Operations
Done in this order: events and rules, document line, issuance, posting and `CompanyEntry`, discount, API of the ledger, plan item event, client regeneration, frontend.

## N — Norms
`conventions/practices.md` §2 (rules in the models) and §3b (the posting is a service).

## S — Safeguards
- **Money:** the fee and the condominium lines are posted atomically; a refused posting leaves neither. The fee has no sub-conta, so there is nothing to mis-assign.
- A refund or a manual reversal of a paid boleto must also reverse the `CompanyEntry` (a `CompanyEntry` cannot be edited or deleted, so it needs a reversing entry): to decide with the refund handling of spec 034, not built here.
- The amount already issued is never recalculated.
- Payment at the counter without the fee is **not** supported: the gateway boleto and the counter payment are different paths (later).

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_registration_fee.py::test_a_company_event_has_no_sub_conta`, `::test_any_other_event_needs_its_sub_conta` |
| R2 | `apps/billing/tests/test_registration_fee.py::test_a_line_that_credits_the_company_has_no_cost_center_and_the_others_have_both` |
| R3 | `apps/billing/tests/test_registration_fee.py::test_the_fee_is_credited_to_the_administradora_and_never_to_the_condominium`, `::test_the_issuance_adds_the_fee_as_its_own_line` |
| R4 | `apps/billing/tests/test_registration_fee.py::test_a_company_entry_never_changes_or_goes` |
| R5 | `apps/billing/tests/test_registration_fee.py::test_the_discount_never_applies_to_the_fee`, `::test_without_a_fee_the_discount_stays_a_percentage` |
| R6 | `apps/billing/tests/test_registration_fee.py::test_the_issuance_adds_the_fee_as_its_own_line` (the line is a document item the PDF lists); the discount sentence: gap, covered by the manual PDF run |
| R7 | `apps/billing/tests/test_registration_fee.py::test_a_second_copy_charges_the_same_fee_once` |
| R8 | `apps/billing/tests/test_registration_fee.py::test_the_line_opens_with_the_code_and_the_name`, `apps/billing/tests/test_billing_plan_item.py::test_an_item_with_an_event_prints_the_code_and_the_name`, `::test_an_item_needs_an_event_or_a_description_and_never_the_administradora_event` |
| R9 | `apps/billing/tests/test_company_entries.py::test_list_filter_and_balance`, `::test_another_company_sees_nothing`; the screen: `frontend/tests/billing-entry.test.mjs` (a fee entry has no sub-account) and the browser run |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`)
- [x] `docs/apps/billing.md` and `docs/apps/finance.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated (if **Roadmap** is set): `N/A — Roadmap: none`; index in `features/README.md` updated

## Pending before `done`
The user's use of it on real data, and the payment of a real sandbox boleto with a fee line (see spec 037). Left for later: the payment at the administradora's counter (*caixa*), and the reversal of a company entry on a refund. The discount sentence on the PDF was not rendered in a test; check the boleto PDF by eye once.
