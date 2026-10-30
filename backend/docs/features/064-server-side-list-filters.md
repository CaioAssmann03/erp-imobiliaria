---
summary: Every list filter and search runs in the API, never on the client; adds the filters the screens were doing themselves (company entries by condominium, billing entries and blocks by text, unit people by text and current links).
read-when: you add a filter or a search to a list endpoint, or you wonder why a screen no longer filters what the API returned
skip-if: the global search → apps/core.md; the statement or accounts-payable filters that already exist → apps/finance.md; the process → features/README.md
---
# 064 — Server-side list filters

**Status:** done · **Level:** full · **Roadmap:** none · **Apps:** finance, billing, condominiums · **Frontend impact:** client regeneration

## Open questions
- [x] Where may a screen filter or search what a list returned? (decided: nowhere, see Decisions)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | A screen never filters or searches the records of a list on the client: every criterion is a query parameter of the API and every list is paginated by the API. Where a screen did it, the API gets the filter. | the user |
| 2026-10-30 | The choices of a closed select (a few dozen condominiums, blocks, events) may still be narrowed by typing in the dropdown: that narrows the options of a field, not the records of a list. | agent, to be confirmed |

## R — Requirements
The screens filtered on the client because the API lacked a parameter: the company account (by condominium, through the name in the description), the billing entries of a month (by text), the blocks of a condominium (by name) and the people of a unit or condominium (by text and by "current" links, comparing dates in the browser) and the dashboard (the condominiums with no boleto in the month, by crossing two lists). A filter on the client breaks the pagination (it only sees the page it got), the counts and the order.
- [x] R1 — `GET /company-entries/?condominium=<id>` keeps the entries of the documents of that condominium.
- [x] R2 — `GET /billing-entries/?query=` searches the event name, the description and the sub-conta name.
- [x] R3 — `GET /blocks/?query=` searches the block name.
- [x] R4 — `GET /unit-people/?query=` searches the person (name, e-mail, CPF/CNPJ, code) and `?is_current=true` keeps the links with no end date or an end date today or later.
- [x] R5 — `GET /billing-runs/coverage/?reference_month=` answers the active condominiums (`expected`), how many have a boleto issued in the month (`issued`) and which do not (`missing`: id, code, name).
- [x] R6 — `GET /billing-events/?credits_company=` keeps the administradora's own events (fees) or leaves them out.
- [x] R7 — `GET /cost-center-catalog/?unused_by_condominium=<id>` leaves out the catalog items that condominium already has a sub-conta of.
- [x] R8 — The frontend sends these parameters and no longer filters the lists (norm written in `frontend/docs/norms/data-and-cache.md`).

## E — Entities
N/A — no model or field changes.

## A — Approach
Each filter is a `django-filter` field (R1, `is_current`) or the shared `QuerySearchFilter` (R2–R4), as the other lists already do. `is_current` reuses `UnitPerson.objects.current(today)`, the same rule the people of a condominium already use.

## S — Structure
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/company-entries/` | `?condominium=` | unchanged | `apps/finance/views/company_entry_views.py` |
| GET | `/api/billing-entries/` | `?query=` | unchanged | `apps/billing/views/billing_entry_views.py` |
| GET | `/api/blocks/` | `?query=` | unchanged | `apps/condominiums/views/block_views.py` |
| GET | `/api/unit-people/` | `?query=`, `?is_current=` | unchanged | `apps/condominiums/filters.py`, `views/unit_person_views.py` |
| GET | `/api/billing-events/` | `?credits_company=` | unchanged | `apps/billing/views/billing_event_views.py` |
| GET | `/api/cost-center-catalog/` | `?unused_by_condominium=` | unchanged | `apps/finance/filters.py`, `views/cost_center_catalog_item_views.py` |
| GET | `/api/billing-runs/coverage/` | `?reference_month=` | `{expected, issued, missing[]}` | `services/build_issuance_coverage.py`, `views/billing_run_views.py` |

## O — Operations
1. Add the filters and search fields. 2. Tests. 3. `pnpm generate:api`, then the screens send the parameters and drop their client filters.

## N — Norms
`conventions/practices.md` (filters live in `filters.py`; search through `QuerySearchFilter`).

## S — Safeguards
Backward compatible: only new optional parameters. Company scoping is unchanged (`CompanyScopedViewSetMixin`). Search joins are `select_related` already; no new index is needed for lists this size.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/billing/tests/test_company_entries.py::test_filter_by_condominium` |
| R2 | `apps/billing/tests/test_billing_entry_api.py::test_query_searches_event_description_and_cost_center` |
| R3 | `apps/condominiums/tests/test_block_search.py::test_query_searches_the_block_name` |
| R4 | `apps/condominiums/tests/test_unit_person_filters.py::test_query_searches_the_person`, `::test_is_current_keeps_links_without_end_or_ending_today_or_later` |
| R5 | `apps/billing/tests/test_billing_run_api.py::test_coverage_says_which_active_condominiums_have_no_boleto_in_the_month` |
| R6 | `apps/billing/tests/test_billing_entry_api.py::test_events_filter_by_credits_company` |
| R7 | `apps/finance/tests/test_cost_center_catalog.py::test_unused_by_condominium_leaves_out_the_items_the_condominium_already_has` |
| R8 | `frontend/tests/server-side-filters.test.mjs` (no list component filters the API results on the client), `frontend/tests/payable-windows.test.mjs` |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any) — N/A, no known gap
- [x] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated — roadmap N/A (none), index updated
