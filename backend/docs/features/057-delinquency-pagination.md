---
summary: Spec 057 — the overdue-boletos report answers its rows 10 per page on the screen endpoint (totals still cover every boleto); the PDF keeps the whole list.
read-when: you change the delinquency report rows, its page size, or the Inadimplência screen's pagination
skip-if: the report's totals, filters and PDF → features/052-reports-delinquency-and-accountability.md; the boleto record → apps/billing.md
---
# 057 — Delinquency report pagination

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | At most 10 overdue boletos per page on the screen endpoint | user |
| 2026-10-30 | Only `rows` is paginated: `count`, `total_amount` and `by_condominium` still cover every overdue boleto, and the PDF keeps the whole list (up to `ROW_LIMIT`) | agent, to be confirmed |
| 2026-10-30 | `?page=` (default 1, min 1, another value is a 400); a page past the end answers no rows. The page size is 10 by default; `?page_size=` (1–100, another value is a 400) lets the screen ask for more (added 2026-10-30) | user |

## R — Requirements
The screen lists every overdue boleto at once (up to 2000), which is long to read. The report answers its rows by page.
- [ ] R1 — `GET /api/billing-documents/delinquency/` returns at most 10 `rows` per call, the page asked by `?page=` (default 1), in the same order as before; the response adds `page`, `page_size` and `page_count`
- [ ] R2 — `count`, `total_amount` and `by_condominium` cover all the overdue boletos whatever the page; a page past the end has no rows; `?page=0` or a non-number is a 400
- [ ] R3 — `delinquency/pdf/` is unchanged: it lists all the rows (up to `ROW_LIMIT`)

## E — Entities
`No schema change.`

## S — Structure
- `apps/billing/services/build_delinquency_report.py` — `build_delinquency_report(documents, as_of, page=None)`: with `page` the rows are that page of `PAGE_SIZE` (10); without it the whole list as before
- `apps/billing/serializers/delinquency_report_serializers.py` — `page`, `page_size`, `page_count` on the report; a `DelinquencyQuerySerializer` for `?page=`
- `apps/billing/views/billing_document_views.py` — the `delinquency` action reads `?page=`

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_delinquency_report.py::test_rows_come_ten_per_page` |
| R2 | `apps/billing/tests/test_delinquency_report.py::test_totals_cover_every_page_and_a_bad_page_is_refused` |
| R3 | `apps/billing/tests/test_delinquency_report.py::test_the_pdf_service_keeps_every_row` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/billing.md` updated; roadmap part/phase and the spec index updated (if applicable)
