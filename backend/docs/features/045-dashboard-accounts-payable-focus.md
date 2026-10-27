---
summary: Spec 045 — read-only endpoint with the open accounts to pay by due window, capped by the server, for the dashboard's focus view.
read-when: you touch the dashboard's accounts-payable focus view, its endpoint, or the cap on its lists
skip-if: the dashboard card and its totals → apps/core.md; the paginated accounts-payable list → apps/finance.md; the process → features/README.md
---
# 045 — Dashboard accounts-payable focus

**Status:** draft · **Level:** lite · **Roadmap:** none · **Apps:** core · **Frontend impact:** client regeneration

## Open questions
- [ ] How many accounts per window? (recommended: 20, a constant `FOCUS_PAYABLES_LIMIT` next to `UPCOMING_PAYABLES_LIMIT` in `accounts_payable/data.py`)
- [ ] Should the windows reuse the card's definitions (`due_next_7_days` = tomorrow..+7, `due_this_month` = month start..end, so a tab and its tile always agree)? Today the screen filters differently (week = today..+7, month = today..month end). (recommended: yes, reuse the backend definitions)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-23 | The focus view gets its own nested route under the dashboard; `/api/dashboard/` stays light, for the cards only | the user |
| 2026-10-23 | The server owns the cap; the client sends no `limit` and does no sorting or filtering | the user |

## R — Requirements
The focus view of accounts payable loads `/api/accounts-payable/?limit=100` and then sorts and filters in the browser, so the cap lives in the frontend and
a window such as "Atrasadas" is wrong past 100 accounts. The server must return each window already sorted and capped, with its real total.
- [ ] R1 — `GET /api/dashboard/accounts-payable/` returns `open`, `overdue`, `due_today`, `due_next_7_days` and `due_this_month`, each as `{count, total, items}`
- [ ] R2 — `items` holds only open accounts of the window, oldest due date first (ties by `created_at`), at most `FOCUS_PAYABLES_LIMIT`; `count` and `total` cover the whole window
- [ ] R3 — Only the user's company accounts appear (same scoping as the dashboard); company expenses are included
- [ ] R4 — Each item has the fields of `UpcomingPayable`; `/api/dashboard/` is unchanged

## E — Entities
No schema change.

## S — Structure
`GET /api/dashboard/accounts-payable/` → `{open|overdue|due_today|due_next_7_days|due_this_month: {count, total, items: [UpcomingPayable]}}`; no query parameters.
Change, all in the card's package `apps/core/views/dashboard/accounts_payable/`: `data.py` (a function building one window, shared with the card), `serializers.py`, a new `focus_view.py`;
plus `apps/core/urls.py` and `apps/core/views/__init__.py`.

## Test plan
| Criterion | Test |
|---|---|
| R1–R2 | `apps/core/tests/dashboard/test_accounts_payable_focus.py::test_windows_are_sorted_capped_with_real_totals` |
| R3 | `apps/core/tests/dashboard/test_accounts_payable_focus.py::test_only_own_company_accounts` |
| R4 | `apps/core/tests/dashboard/test_core_dashboard.py` (existing accounts-payable tests keep passing) |

## Definition of done
- [ ] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes; client regenerated and `AccountsPayableFocus` fixed (`pnpm generate:api`)
- [ ] `docs/apps/core.md` updated; spec index updated
