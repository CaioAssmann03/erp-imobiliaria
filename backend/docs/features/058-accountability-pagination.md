---
summary: Spec 058 — the accountability report answers its sub-contas and its entries 10 per page, each with its own page, on the screen endpoint (totals still cover everything); the PDF keeps the whole lists.
read-when: you change the accountability report lists, their page size, or the Prestação de contas screen's pagination
skip-if: the report's totals, balances and PDF → features/052-reports-delinquency-and-accountability.md; the ledger records → apps/finance.md
---
# 058 — Accountability report pagination

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** finance · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | At most 10 sub-contas and 10 entries per page on the screen endpoint | user |
| 2026-10-30 | The two lists are shown one at a time, so each has its own page: `?cost_centers_page=` and `?entries_page=` (default 1, min 1, another value is a 400). The page size is 10 by default; `?page_size=` (1–100, another value is a 400) lets the screen ask for more, for both lists (added 2026-10-30) | user |
| 2026-10-30 | Only `by_cost_center` and `entries` are paginated: the balances and totals of the month cover every sub-conta and entry, and the PDF keeps both whole lists (up to `ROW_LIMIT` entries) | agent, to be confirmed |

## R — Requirements
The screen lists every sub-conta and up to 2000 entries at once. Both lists come by page.
- [x] R1 — `GET /api/current-account-entries/accountability/` returns at most 10 `by_cost_center` lines and at most 10 `entries`, the pages asked by `?cost_centers_page=` and `?entries_page=` (default 1), in the same order as before; the response adds `page_size`, `cost_center_count`, `cost_center_page`, `cost_center_page_count`, `entry_count`, `entry_page` and `entry_page_count`
- [x] R2 — `opening_balance`, `total_credits`, `total_debits` and `closing_balance` cover every sub-conta whatever the page; a page past the end has no lines; `?entries_page=0` or a non-number is a 400
- [x] R3 — `accountability/pdf/` is unchanged: it lists every sub-conta and all the entries (up to `ROW_LIMIT`)

## E — Entities
`No schema change.`

## S — Structure
- `apps/finance/services/build_accountability_report.py` — `build_accountability_report(condominium, month, entries, pages=None)`: with an `AccountabilityPages` the two lists are those pages of `PAGE_SIZE` (10); without it the whole lists as before
- `apps/finance/serializers/accountability_report_serializers.py` — the page fields on the report; an `AccountabilityPageQuerySerializer` for the two parameters
- `apps/finance/views/current_account_entry_views.py` — the `accountability` action reads them; the PDF action does not

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_accountability_report.py::test_the_lists_come_ten_per_page` |
| R2 | `apps/finance/tests/test_accountability_report.py::test_totals_cover_every_page_and_a_bad_page_is_refused` |
| R3 | `apps/finance/tests/test_accountability_report.py::test_the_pdf_service_keeps_every_line` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/finance.md` updated; roadmap part/phase and the spec index updated (if applicable)
