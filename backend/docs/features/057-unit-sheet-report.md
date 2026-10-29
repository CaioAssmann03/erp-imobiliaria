---
summary: Spec 057 — the Ficha da unidade report: one page with the unit's data and people, its boletos with their situation and its entries in the condominium's account, on screen and as PDF.
read-when: you change what the unit sheet shows, its period filter, its screen or its PDF
skip-if: the other reports → features/052-reports-delinquency-and-accountability.md; the unit's own screen → features/050 in history.md; the administration fee → features/056-administration-fee-report.md
---
# 057 — Unit sheet report (Ficha da unidade)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** condominiums, billing, finance, frontend · **Frontend impact:** client regeneration, new screen, a button on the unit page

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | The sheet has three blocks: **dados e pessoas** (the unit, its fractions, the registered values, the current owners and tenants), **boletos e situação** and **lançamentos do extrato** (the unit's credits and debits in the condominium's account). The **history of owners** is left out | the user |
| 2026-10-29 | It opens from the **Relatórios** menu (pick the condominium and the unit) and from a **Ficha** button on the unit's page; the default period is the **last 12 months**, with a filter | the user |
| 2026-10-29 | The period filters the boletos by **reference month** and the entries by **entry date**; the people and the data are as of today. It is `?from_month=` and `?to_month=` (first days of months, inclusive), default the 11 months before this month through this month | agent, to be confirmed |
| 2026-10-29 | The boletos block shows every boleto of the period, **monthly and extra** (the kind is a column), with status, due date, amount, days overdue and payment date, and the totals **issued, paid, open and overdue** (a cancelled boleto is listed and counts in none) | agent, to be confirmed |
| 2026-10-29 | The endpoints answer JSON and, on `/pdf/`, the PDF bytes (nothing stored); at most 2000 rows per list, with `truncated` | agent, to be confirmed |

## R — Requirements
- [x] R1 — `GET /api/current-account-entries/unit-sheet/?unit=` answers the unit's data (condominium, block, type, flags, registered values), its fractions per criterion, its current owners (with percentage) and tenants, `boletos` with totals and `entries` with totals; a unit of another company is a 404
- [x] R2 — `?from_month=` and `?to_month=` (first days of months; the last not before the first, at most 36 months) filter the period, defaulting to the last 12 months; an invalid value is a 400 with a coded error
- [x] R3 — The totals of the boletos are `issued` (not cancelled), `paid`, `open` (awaiting payment) and `overdue` (awaiting payment past the due date); `issued = paid + open`
- [x] R4 — The entries are those whose `unit` is the unit and whose `entry_date` is in the period, with `total_credits` and `total_debits`
- [x] R5 — `…/unit-sheet/pdf/` answers the same sheet as a PDF; the text is escaped
- [x] R6 — The screen `/reports/unit-sheet` has the condominium and unit pickers and the period filter, shows the three blocks and **Baixar PDF**; the unit's page has a **Ficha** button that opens it for that unit; the menu item and the report card open it
- [x] R7 — The sheet is read only

## E — Entities
N/A — no model, no migration.

## A — Approach
- **It lives in `finance`, next to the other reports.** `finance` already depends on `condominiums` and `billing`, so the sheet is an `@action` of `CurrentAccountEntryViewSet` (`unit-sheet`, `unit-sheet/pdf`) and the dependency direction is kept (`condominiums` never imports billing or finance).
- **A service builds it** (`finance/services/build_unit_sheet.py`: dataclasses of the unit, people, boletos and entries with their totals) and **renders** it (`render_unit_sheet_pdf.py`). The unit is looked up in the user's company, so another company's unit is a 404.
- The rules (what is overdue, who is the current owner or tenant) stay in the models (`BillingDocument.is_overdue_on`, `UnitPerson` dates); the service only gathers and sums.
- Rejected: storing the PDF; a history of owners (not requested); putting the endpoint in `UnitViewSet` (it would make `condominiums` import billing and finance).

## S — Structure
| Method | URL | Request | Response |
|---|---|---|---|
| GET | `/api/current-account-entries/unit-sheet/` | `?unit=` (required), `?from_month=`, `?to_month=` | `UnitSheet` |
| GET | `/api/current-account-entries/unit-sheet/pdf/` | same | PDF |

Frontend: `app/(dashboard)/reports/unit-sheet/**`, a **Ficha** link in the unit page header, `lib/reports.ts`, `lib/module-menu.ts`, `reports/page.tsx`.

## O — Operations
1. Service and endpoints. 2. PDF. 3. Client regeneration and screen. 4. The button on the unit page. 5. Docs and gate.

## N — Norms
Rules in models; one service per use case; frontend tokens only, Portuguese UI.

## S — Safeguards
- **Scoping:** `unit` is looked up in the company's units (another company's unit is a 404); billing documents and entries are read through that unit only.
- **Money:** `Decimal` sums; the totals are computed over the whole period even when a list is truncated.
- **Personal data:** the sheet shows the names and percentages of the unit's people, nothing else (no tax id).

## Test plan
| Criterion | Test |
|---|---|
| R1–R4, R7 | `finance/tests/test_unit_sheet.py` |
| R5 | `finance/tests/test_unit_sheet.py` (PDF) |
| R6 | `frontend/tests/reports.test.mjs` (file name and default period); the screen checked by hand in the browser |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan, or a written gap
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [x] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
