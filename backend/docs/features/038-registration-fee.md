---
summary: Spec 038 — the bank registration fee charged on every boleto is revenue of the administradora, never credited to a condominium.
read-when: you build or change the registration fee line of a boleto, the administradora's own ledger or how a payment splits between a condominium and the administradora
skip-if: the single gateway account → features/037-single-gateway-account.md; the payment posting → features/032-payment-webhook.md; the ledger of a condominium → apps/finance.md
---
# 038 — Registration fee (tarifa de registro)

**Status:** draft · **Level:** full · **Roadmap:** none · **Apps:** billing, finance · **Frontend impact:** client regeneration

## Open questions
- [ ] **The fee as a launch.** The boleto the user sent (below) lists the fee as an ordinary line, `0005-TARIFA BANCO 3,90`, next to `2772-PINTURA FACHADA 30,00` and `0052-CONDOMINIO 170,00`: the staff launches it like any value, with an **event**, when they launch the charges (answer 2). Proposal (replaces the earlier "own mechanism" recommendation): an **event can be marked "receita da imobiliária"** (`BillingEvent.credits_company`, e.g. 0005 TARIFA BANCO); a launch with such an event has **no sub-conta** and its money is credited to the administradora's own ledger, **never to a condominium** (a rule in the models refuses a sub-conta on it and refuses the credit to a condominium). OK? (recommended: yes, it is how the staff already works)
- [ ] **"PAGAMENTO NA ADM. SEM TAXA BANCO ATÉ 10/10/2026: 200,00".** The boleto says that paying at the administradora's counter costs the total **without the fee** (203,90 − 3,90). Is that a manual payment entry (*baixa manual*) the system must support, crediting the items but not the fee? (recommended: yes, as its own spec after this one; the gateway boleto and the counter payment are different paths)
- [ ] **The late fee base.** The boleto prints `MULTA APÓS 10/10/2026: 4,04` on a total of 203,90 (2% of 203,90 would be 4,08; 2% of 200,00 is 4,00). Is the fee left out of the base of the multa and interest? (recommended: yes, the fee is a flat amount; please tell how 4,04 is computed)
- [ ] **How a line prints.** The boleto prints `<event code, 4 digits>-<EVENT NAME>` (`0005-TARIFA BANCO`, `0052-CONDOMINIO`): even the fixed monthly fee is an event. Print every line this way (event code and name, then the description), and let a **plan item** name an event too? (recommended: yes; today a plan item has only a free description and a launch prints "name - description" without the code)

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

## Example sent by the user (2026-10-27)
A Santander boleto issued in the administradora's own name (beneficiary EVE ADM DE IMOVEIS COND E VENDAS), competence SET/2026, due 10/10/2026, unit "Apto 103", "SÉRIE: 195 REGISTRO: 6518". Lines: `0005-TARIFA BANCO 3,90`, `2772-PINTURA FACHADA 30,00`, `0052-CONDOMINIO 170,00`; `TOTAL ATÉ 10/10/2026 203,90`; `MULTA APÓS 10/10/2026 4,04`; `TOTAL C/MULTA APÓS 10/10/2026 207,94`; `PAGAMENTO NA ADM. SEM TAXA BANCO ATÉ 10/10/2026 200,00`; "APÓS VENCIMENTO ACRESCER CORREÇÃO MONETÁRIA, JUROS DE 1% A.M E MULTA DE 2%".

## R — Requirements
A boleto total is the sum of its items plus the fee. When it is paid, the items are credited to the condominium's cost centers (spec 032) and the fee is credited to the administradora, in the same transaction.
- [ ] R1 — A document has a `registration_fee` (zero or positive), copied from the company setting at issuance, and its `amount` (the charge value sent to the gateway) is the sum of the items plus the fee
- [ ] R2 — The fee is not an item: no condominium cost center, entry template or current-account entry is ever created for it
- [ ] R3 — A paid document credits one company entry for the fee (only when it is above zero), once, in the same transaction as the item credits
- [ ] R4 — The paid amount check of spec 032 compares the payment with the document's `amount` (items plus fee); a different amount posts nothing
- [ ] R5 — The discount, the late fee and the interest are computed over the items only (pending the question above)
- [ ] R6 — The PDF and the e-mail show the fee as its own line
- [ ] R7 — The company ledger entry is immutable once written and unique per document

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `Company` | changed | `registration_fee` decimal, default 0, not negative |
| `BillingDocument` | changed | `registration_fee` decimal, default 0; `amount` = items + fee; a rule in the model keeps the sum |
| `CompanyEntry` (*LancamentoEmpresa*) | new, `@final`, in `finance` | `company`, `billing_document` OneToOne (`PROTECT`), `entry_date`, `amount` (positive), `description`, `origin` `automatic_billing`; no balance cache (summed) |

## A — Approach
To be written when the open questions are answered. Direction: the posting service adds one `CompanyEntry` next to the item credits inside the existing transaction; the condominium ledger code is not touched.

## S — Structure
To be written with the approach.

## O — Operations
To be written with the approach.

## N — Norms
`conventions/practices.md` §2 (rules in the models) and §3b (a service per use case).

## S — Safeguards
- A refund or a manual reversal of a paid boleto must also reverse the fee entry (decide with spec 034's refund handling).
- Money: the fee entry and the item credits are posted atomically; a refused posting leaves neither.
- The amount already issued is never recalculated when the company setting changes.

## Test plan
To be filled when the spec is `ready`; every criterion above gets a test.

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [ ] `docs/apps/billing.md` and `docs/apps/finance.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated; index in `features/README.md` updated
