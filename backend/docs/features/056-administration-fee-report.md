---
summary: Spec 056 — the Taxa de administração report: what the administradora has to charge each condominium in a month, from its contract and its current account, on screen and as PDF.
read-when: you change how the administration fee is calculated for the report, its screen or its PDF
skip-if: the other reports → features/052-reports-delinquency-and-accountability.md; the contract's fields → apps/condominiums.md; posting the fee to the ledger → not built, it will be its own spec
---
# 056 — Administration fee report

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** condominiums, finance, frontend · **Frontend impact:** client regeneration, new screen

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | The report is **only a report**: it shows what is due, it does not post the fee in the condominium's account (posting it is a later spec with its own reversal and repeat rules) | the user |
| 2026-10-29 | For a **variable** fee the base is the **month's statement**: *revenue* = the credits and *expense* = the debits of the condominium's current account whose `entry_date` is in the month | the user |
| 2026-10-29 | One row **per active condominium** of the company, for one month. A **fixed** fee is the contract's `fee_amount`; a **variable** one is `base × percentage`, kept between the contract's floor and ceiling when they exist (the floor and the ceiling do not apply to a fixed fee) | agent, to be confirmed |
| 2026-10-29 | A month before the contract's `start_date` month is **not due** (fee 0, status `not_started`); an active condominium **without a contract** appears with status `no_contract` and no fee, so the staff sees what is missing; neither enters the totals | agent, to be confirmed |
| 2026-10-29 | The ISS is **not calculated** (no rate is stored): the row only says whether the contract charges ISS on the fee (`charges_iss_on_fee`) | agent, to be confirmed |
| 2026-10-29 | The fee is rounded half-up to the cent; the rule lives in the contract model (`fee_for(base)`), the service only totals | agent, to be confirmed |

## R — Requirements
- [x] R1 — `GET /api/current-account-entries/administration-fee/?month=` (first day of a month, required) answers `month`, `count`, `total_fee` and `rows`, one per active condominium of the user's company (never another company's); `?condominium=` limits it to one
- [x] R2 — A fixed contract is due its `fee_amount`; a variable one `base × percentage / 100`, between the floor and the ceiling when set, rounded half-up to the cent; `base` is the month's credits (basis revenue) or debits (basis expense) of the condominium's account by `entry_date`
- [x] R3 — A month before the contract starts is `not_started` (fee 0) and a condominium without a contract is `no_contract`; both are in `rows` and out of `count` and `total_fee`
- [x] R4 — Each row carries condominium, fee type, basis, percentage, fixed amount, floor, ceiling, base amount (variable only), the fee before the limits, the fee due, `charges_iss_on_fee` and the status
- [x] R5 — `…/administration-fee/pdf/` answers the same report as a PDF honoring the same filters; the text is escaped
- [x] R6 — The screen `/reports/administration-fee` has the month filter, the totals, the table and **Baixar PDF**; the menu item and the report card open it
- [x] R7 — The report is read only: no entry, no contract change

## E — Entities
N/A — no model field, no migration. New methods on `CondominiumAdministrationContract`: `fee_for(base_amount)` and `is_due_in(month)`.

## A — Approach
- **Rule in the model, report in a service.** `CondominiumAdministrationContract.fee_for` holds the arithmetic (fixed, variable, floor, ceiling, half-up); `finance/services/build_administration_fee_report.py` groups the month's credits and debits per condominium in two queries and totals; `render_administration_fee_pdf.py` renders it like the accountability PDF.
- It is an `@action` of `CurrentAccountEntryViewSet` (the base is the ledger, scoped by the viewset), next to `accountability`.
- Rejected: posting the fee as a debit (separate spec); calculating ISS (no stored rate).

## S — Structure
| Method | URL | Request | Response |
|---|---|---|---|
| GET | `/api/current-account-entries/administration-fee/` | `?month=`, `?condominium=` | `AdministrationFeeReport` |
| GET | `/api/current-account-entries/administration-fee/pdf/` | same | PDF |

Frontend: `app/(dashboard)/reports/administration-fee/**`, `lib/reports.ts` (file name), `lib/module-menu.ts`, `reports/page.tsx`.

## O — Operations
1. Contract methods and tests. 2. Report service and endpoints. 3. PDF. 4. Client regeneration and screen. 5. Docs and gate.

## N — Norms
Rules in models; one service per use case; frontend tokens only, Portuguese UI.

## S — Safeguards
- **Money:** exact `Decimal` arithmetic, half-up to the cent; the totals sum the rows; a report never writes.
- **Scoping:** the viewset's queryset and the company's condominiums only; another company's condominium id is a 404.
- **Honesty of the screen:** a contract not started or missing is shown, not hidden or counted as zero revenue.

## Test plan
| Criterion | Test |
|---|---|
| R2 | `condominiums/tests/test_administration_fee.py` (fixed, variable, floor, ceiling, rounding) |
| R1, R3, R4, R7 | `finance/tests/test_administration_fee_report.py` |
| R5 | `finance/tests/test_administration_fee_report.py` (PDF) |
| R6 | `frontend/tests/reports.test.mjs` (file name); the screen checked by hand in the browser |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan, or a written gap
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
