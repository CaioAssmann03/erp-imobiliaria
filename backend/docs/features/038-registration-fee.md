---
summary: Spec 038 — the bank registration fee charged on every boleto is revenue of the administradora, never credited to a condominium.
read-when: you build or change the registration fee line of a boleto, the administradora's own ledger or how a payment splits between a condominium and the administradora
skip-if: the single gateway account → features/037-single-gateway-account.md; the payment posting → features/032-payment-webhook.md; the ledger of a condominium → apps/finance.md
---
# 038 — Registration fee (tarifa de registro)

**Status:** draft · **Level:** full · **Roadmap:** none · **Apps:** billing, finance · **Frontend impact:** client regeneration

## Open questions
- [ ] Where does the fee credit live? Today only a condominium has a current account. (recommended: a new **company ledger** — `CompanyEntry`, one credit per paid boleto, with a balance computed by summing, shown in the Admin and in a read-only endpoint later; it does not touch the rules of the condominium ledger)
- [ ] Where is the amount defined? (recommended: a company setting, `registration_fee` (R$ 3.90 today), copied onto each document when it is issued so a later change does not alter a boleto already issued; a per-condominium override only if needed)
- [ ] Does the real cost of the gateway (R$ 1.20 per boleto, then what Asaas charges) appear in the system? (recommended: no; the credit is the fee charged, and the cost stays on the Asaas statement. `net_amount` of the payment already records what Asaas reports)
- [ ] Do the early-payment discount, the late fee and the interest apply to the fee? (recommended: no, they apply only to the items; the fee is a flat amount added to the boleto total)
- [ ] Is the fee printed on the boleto PDF and on the e-mail as its own line? (recommended: yes, "Tarifa de registro", so the payer sees why the total is higher)
- [ ] When a boleto is cancelled or reissued before it is paid, is the fee charged again? (recommended: no, one fee per document, whatever the number of registrations)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-26 | The administradora always charges a bank registration fee on the boleto and defines its amount (for example R$ 3.90, while the gateway charges it R$ 1.20 per registration) | the user |
| 2026-10-26 | The fee must **never** be credited to the condominium's accounts; it is a credit of the administradora in the system | the user |
| 2026-10-26 | Spec 037 ships without a fee: the documents carry only items, and a payment credits only items, so nothing wrong can reach a condominium meanwhile | agent |

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
