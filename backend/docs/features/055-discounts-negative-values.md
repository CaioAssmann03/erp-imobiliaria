---
summary: Spec 055 — discounts as negative values in Inclusão de valores (and the extra boleto): the line with a minus sign, the boleto total never below the registration fee.
read-when: you change how a negative launch reaches the boleto, its total rule, the ledger posting of a discount or the money mask of the launches
skip-if: the launches themselves → features/039-billing-entries.md; the registration fee → apps/billing.md; the extra boleto → features/054-extra-billing-document.md
---
# 055 — Discounts: negative values in the launches

**Status:** in-progress (built; waiting for the "agent, to be confirmed" decisions) · **Level:** full · **Roadmap:** none · **Apps:** billing, finance, frontend · **Frontend impact:** client regeneration, money mask, labels

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | A **discount** is a launch with a **negative value** in *Inclusão de valores* (the line with a minus sign), in the sub-conta the staff chooses: the boleto shows it as a line with a minus sign and the unit pays less | the user |
| 2026-10-29 | The **total of the boleto cannot fall below the registration-fee value**: a boleto whose lines (the fee apart) sum below zero is **not issued** and the problem shows in the run (and in the extra boleto's skipped list). With no fee line the total must stay above zero | the user |
| 2026-10-29 | There is **no discount on the fee**: a line of an event that credits the administradora cannot be negative | the user |
| 2026-10-29 | A zero value is refused (a negative or positive one is the rule): `amount != 0` on the launch, the unit's own value and the document item | agent, to be confirmed |
| 2026-10-29 | When a discounted boleto is paid, the discount posts as a **debit** of its amount in the line's sub-conta (the unit paid less, so that sub-conta receives less), through the same ledger entry as the credits; a reversal of it is a credit | agent, to be confirmed |
| 2026-10-29 | A unit's own value on an individual launch must have the **same sign** as the launch (a discount launch cannot give one unit a charge) | agent, to be confirmed |
| 2026-10-29 | The early-payment discount, the multa and the interest keep their bases (spec 038): the lines with a minus sign are part of the discountable amount; the fee stays out of the discount only | agent, to be confirmed |
| 2026-10-29 | Plans keep positive values only: a recurring discount is a launch that repeats (`always`), not a plan item | agent, to be confirmed |

## R — Requirements
- [x] R1 — A launch (`BillingEntry`) accepts a negative `amount` and a zero one is refused; a launch of an event that credits the administradora cannot be negative
- [x] R2 — `BillingEntryUnit.amount` accepts a negative value only on a negative launch and a positive one only on a positive launch; zero is refused
- [x] R3 — The allocation (individual, collective, fraction) works with negative totals: the shares are rounded half away from zero and add up to the total
- [x] R4 — A `BillingDocumentItem` accepts a negative `amount` (never on a line that credits the administradora); the document `amount` is still the sum of its items and stays above zero and **not below the fee** (`BillingDocumentRules`)
- [x] R5 — The monthly issuance and the extra boleto carry the negative lines (the zero-value filter becomes `!= 0`); a unit whose total would fall below the fee is skipped with the new problem code `discount_exceeds_total` (a run problem, a skipped unit) and nothing is created for it
- [x] R6 — Paying a boleto posts a negative item as a **debit** of its absolute value in its sub-conta, the same way the credits post; the ledger stays consistent with the amount paid
- [x] R7 — The boleto PDF and the screens show a negative line with a minus sign; the gateway receives the document total (already net of the discounts) and the discount rules of spec 038 unchanged
- [x] R8 — The launches screen and the extra boleto accept a leading minus in the value field, say what a negative value means, and the preview, grid and totals show the sign

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `billing.BillingEntry` | amount may be negative | validator `amount != 0` replaces "positive"; check constraint `amount <> 0`; rule: no negative on a company event |
| `billing.BillingEntryUnit` | amount may be negative | `amount != 0`; same sign as the entry (rule) |
| `billing.BillingDocumentItem` | amount may be negative | `amount != 0`; negative only when `credits_company = false` (check constraint) |
| `billing.BillingDocument` | rule | `amount` ≥ the fee and > 0 |
| `billing.BillingRun.ProblemCode` | `discount_exceeds_total` | no column change (the problems are JSON) |
| `finance.CurrentAccountEntry` | `receiving` | kind follows the sign of the item; the amount is its absolute value |

## A — Approach
- **No new model.** A discount is the same launch with a sign: the allocation, the freeze once used, the frontend grid and the issuance already work per line, so the change is the sign rules and the places that assumed "positive".
- **The rule lives in the models:** `BillingEntryRules` (company event never negative), `BillingEntryUnitRules` (sign), `BillingDocumentItem` constraint, `BillingDocumentRules` (total not below the fee). The issuance only **checks before creating** so the unit is skipped with a precise code instead of a generic "document invalid".
- **Ledger:** `CurrentAccountEntry.receiving` chooses `DEBIT` for a negative item; the existing uniqueness per item and the amount check still hold.
- Rejected: a separate "discount" entity or flag (a sign is simpler and is what the staff wrote on paper); letting the total reach zero (the boleto would have nothing to register).

## S — Structure
No new endpoint. The existing `billing-entries`, `billing-entries/preview/`, `billing-documents/extra/` and the issuance accept negative values; `BillingRun.problems` and the extra boleto's `skipped` may carry `discount_exceeds_total`. Files: the models and rules above, `billing/services/issue_condominium_billing.py`, `issue_extra_billing_document.py`, `finance/models/current_account_entry.py`, the boleto template, migrations (billing `0018`, constraints and validators only), frontend `lib/masks.ts`, `lib/schemas/billing-entry.ts`, `lib/schemas/extra-billing.ts`, `lib/billing-run-problems.ts`, `lib/error-messages.ts`, the grid and the preview; docs.

## O — Operations
1. Backend rules, constraints and migration.
2. Issuance and extra boleto: the pre-check and the new problem code.
3. Ledger posting of a negative item.
4. PDF check; client regeneration.
5. Frontend (mask, schema, hints, sign shown).
6. Tests, docs, gate.

## N — Norms
Rules in models; one service per use case; error codes in `errors/`, translated in `frontend/lib/error-messages.ts`; frontend tokens only, Portuguese UI.

## S — Safeguards
- **Money:** the document amount is still the sum of its items and the model re-checks it; a negative line never makes the total fall below the fee, so the gateway never receives a zero or negative charge; the fee is never discounted and always reaches the administradora's ledger.
- **Ledger:** a negative item posts exactly one debit, once per item (the ledger refuses a second entry for it); a company line is untouched.
- **Compatibility:** existing launches, items and documents are positive and stay valid (the constraints only widen); nothing changes for a boleto without discounts.
- **Idempotency:** the issuance's per-unit rerun rule is unchanged; a skipped unit can be issued after the discount is corrected.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2 | `billing/tests/test_billing_discount.py` (launch and unit amount rules) |
| R3 | `billing/tests/test_billing_discount.py` (shares of a negative total) |
| R4, R5 | `billing/tests/test_billing_discount.py` (document rule, issuance skip, extra skip) |
| R6 | `billing/tests/test_billing_discount.py` (payment posts a debit) |
| R7 | `billing/tests/test_billing_discount.py` (PDF text) |
| R8 | `frontend/tests/billing-entry.test.mjs` (mask, preview and grid with sign); the launch sheet checked by hand in the browser (a `-50,00` launch previews `-R$ 50,00` per unit) — no automated screen test |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan, or a written gap
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
