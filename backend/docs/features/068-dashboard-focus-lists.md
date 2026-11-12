---
summary: Paginated lists behind the dashboard's "ver" views: the next adjustments and the largest fixed fees as endpoints, and `?has_problem=` on the billing runs.
read-when: you wonder why `/dashboard/adjustments/`, `/dashboard/largest-fees/` or `?has_problem=` on billing runs exist
skip-if: the dashboard summary itself → apps/core.md; the billing runs → apps/billing.md; the pagination rule in general → architecture/api.md
---
# 068 — Dashboard focus lists

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** core, billing · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-01 | Every list inside a dashboard "ver" view is paginated, 10 per page by default. The ones that already had a paginated API only get a pager in the frontend; the ones that the dashboard computed itself (next adjustments, largest fixed fees, condominiums without a boleto) get their own pages (two endpoints and `?page=`/`?limit=` on the coverage), and the dashboard payload keeps its short top-N for the card. | the user |
| 2026-11-01 | The runs with a problem are one paginated query with `?has_problem=true` (status `partial` or `failed`), instead of two queries merged by the screen. | agent |

## R — Requirements
The card shows the first few; the "ver" view must let the user reach all of them, a page at a time.
- [x] R1 — `GET /api/dashboard/adjustments/` lists every active condominium's next adjustment by date, paginated (`limit`, `page`), inside the caller's company.
- [x] R2 — `GET /api/dashboard/largest-fees/` lists the active condominiums with a fixed fee, the largest first (ties by condominium code, so no row repeats across pages), paginated, inside the caller's company.
- [x] R4 — `GET /api/billing-runs/coverage/` answers `missing_count` (all of them) and `missing` as one page (`?page=`, `?limit=`, 10 by default, up to 100); the card only needs the count.
- [x] R3 — `GET /api/billing-runs/?has_problem=true` returns the `partial` and `failed` runs; `false` the others.

## E — Entities
No schema change.

## S — Structure
`apps/core/views/dashboard/list_views.py` (the two views, `GenericAPIView` with `StandardPagination`), `apps/core/urls.py`, `fixed_revenue/data.py` (`fee_row`, shared with the card), `CondominiumAdministrationContractQuerySet.largest_fixed_fees` (tie-break), `apps/billing/filters.py` (`BillingRunFilter`), `views/billing_run_views.py` (`has_problem`, and the coverage page), `serializers/issuance_coverage_serializers.py`.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/dashboard/test_dashboard_lists.py::test_adjustments_come_by_date_ten_to_a_page`, `::test_both_lists_stay_inside_the_company` |
| R2 | `apps/core/tests/dashboard/test_dashboard_lists.py::test_largest_fees_come_largest_first_ten_to_a_page` |
| R3 | `apps/billing/tests/test_billing_run_api.py::test_has_problem_lists_partial_and_failed_runs_in_one_query` |
| R4 | `apps/billing/tests/test_billing_run_api.py::test_coverage_lists_the_missing_condominiums_a_page_at_a_time` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [x] `docs/apps/core.md` and `docs/apps/billing.md` updated; spec index updated
