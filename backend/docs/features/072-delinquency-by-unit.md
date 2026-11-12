---
summary: Spec 072 — the delinquency report opens as a summary per unit (months open only on request), filters by condominium and unit, and the PDF can include or leave out the months.
read-when: you change the delinquency report's unit summary, its unit filter, the on-demand months or the PDF's months option
skip-if: the report's totals and filters → features/052-reports-delinquency-and-accountability.md; its row pagination → features/057-delinquency-pagination.md; the boleto record → apps/billing.md
---
# 072 — Delinquency by unit

**Status:** in-progress · **Level:** lite · **Roadmap:** none · **Apps:** billing, frontend · **Frontend impact:** client regeneration, screen change

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-12 | The Inadimplência screen opens **summarized**: one line per **unit** with its total overdue and how many months are open; the **months** (the boletos) of a unit appear **only when the user asks** (clicking the line, or filtering by that unit) | user |
| 2026-11-12 | The report filters by **condominium and unit** (and the reference month it already had); with no condominium it is the general report, with one the condominium's, with a unit the unit's | user |
| 2026-11-12 | The **PDF** follows the screen's filters and prints the unit summary; an option **"include the open months"** also prints each unit's months | user |
| 2026-11-12 | `?include_months=` (default `true`, so every existing consumer keeps its rows): the screen asks `false` for the summary and `true` for one unit's months; the PDF endpoint takes the same flag | agent, to be confirmed |
| 2026-11-12 | `by_unit` is paginated like the rows (`?units_page=`, the same `page_size`) and ordered by `units_order`: `condominium` (code, then unit name), `amount` (largest debt first) or `oldest` (longest overdue first); the totals (`count`, `total_amount`, `by_condominium`) still cover every overdue boleto | agent, to be confirmed |
| 2026-11-12 | A unit line carries the condominium, the unit, the payer of its **oldest** overdue boleto, the number of overdue boletos, the total, the oldest due date and the days overdue of that one | agent, to be confirmed |

## R — Requirements
- [x] R1 — `GET /api/billing-documents/delinquency/` answers `by_unit`: one line per unit with an overdue boleto (`unit_id`, `condominium_id`, `condominium_name`, `unit_name`, `payer_name`, `count`, `total_amount`, `oldest_due_date`, `days_overdue`), a page of `page_size` lines chosen by `?units_page=`, with `units_page`, `unit_count` and `units_page_count`
- [x] R2 — `?unit=` limits the whole report (totals included) to one unit; `?condominium=` and `?reference_month=` keep working together with it; another company's unit gives an empty report
- [x] R3 — `?units_order=` is `condominium` (default), `amount` or `oldest`; another value is a 400
- [x] R4 — `?include_months=false` answers no `rows` (and `page_count` 1); the default `true` answers them as before
- [x] R5 — `delinquency/pdf/` honors `?unit=`, the other filters and `?include_months=`: without the months it prints the unit lines, with them also each unit's boletos
- [x] R6 — The screen shows the units summary with a **Meses** disclosure per line that loads that unit's months on click, a **Unidade** filter next to the condominium (listing the chosen condominium's units), the totals as before, and a PDF button with an "incluir os meses" option

## E — Entities
`No schema change.`

## S — Structure
- `billing/services/build_delinquency_report.py` — `by_unit` (grouped query, paged), `include_months`
- `billing/serializers/delinquency_report_serializers.py`, `billing/views/billing_document_views.py` (`unit` in `DELINQUENCY_FILTERS`, the new query params, the PDF flag), `billing/services/render_delinquency_pdf.py` and its template
- frontend: `app/(dashboard)/reports/delinquency/**`, `lib/reports/reports.ts`

## Test plan
| Criterion | Test |
|---|---|
| R1, R3 | `billing/tests/test_delinquency_by_unit.py` |
| R2, R4, R5 | `billing/tests/test_delinquency_by_unit.py` |
| R6 | `frontend/tests/reports.test.mjs` and `url-scope.test.mjs` (the pure helpers); the screen checked by hand in the browser (summary, a unit opened, the unit filter, the PDF with and without months) — no automated screen test |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [x] `docs/apps/billing.md` updated; the spec index updated
