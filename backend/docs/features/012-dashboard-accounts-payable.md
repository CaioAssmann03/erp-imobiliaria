---
summary: Spec (lite): the dashboard API gains an `accounts_payable` section (open accounts by due window plus the oldest ones), company-scoped; read-only.
read-when: you touch the dashboard payables numbers or reuse the open/overdue account filters
skip-if: the account payable itself → features/011-accounts-payable.md; the dashboard's other sections → apps/core.md; the payables screens → roadmap/phase-3-finance-base/07-accounts-payable-screens.md
---
# 012 — Dashboard: accounts payable

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** core, finance, frontend · **Frontend impact:** client regeneration + dashboard widgets

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Count every **open** account, including the company's own expenses (no condominium); paid and cancelled ones are left out | the user |
| 2026-10-05 | The dashboard puts accounts payable first (frontend); inadimplência, boletos and bank reconciliation wait for phases 4–5 (no empty widgets) | the user |
| 2026-10-05 | Windows (reference date = today): `overdue` = due before today; `due_today`; `due_next_7_days` = tomorrow to today + 7; `due_this_month` = due inside the calendar month (an overdue account of a previous month is not in it); `upcoming` = the 6 oldest open accounts (overdue first) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The open/overdue/window filters are methods of `AccountPayableQuerySet`, so the dashboard holds no rule | agent |

## R — Requirements
The staff open the dashboard to see what must be paid. `GET /api/dashboard/` returns `accounts_payable`:
- [x] R1 — `overdue`, `due_today`, `due_next_7_days`, `due_this_month`, each `{count, total}` (`total` is a decimal string, `"0.00"` when empty)
- [x] R2 — `upcoming`: up to 6 open accounts ordered by due date with `id`, `description`, `supplier_name`, `condominium_name` (`null` for a company expense), `due_date`, `amount`, `overdue`
- [x] R3 — only `open` accounts count; paid and cancelled never appear
- [x] R4 — only the user's company (a superuser sees every company), like the other sections

## E — Entities
No schema change.

## S — Structure
`apps/finance/models/account_payable.py` (`AccountPayableQuerySet`: `open`, `overdue`, `due_between`), `apps/core/serializers/dashboard_serializers.py`, `apps/core/views/dashboard_views.py` (`_accounts_payable`), tests in `apps/core/tests/test_core_dashboard.py`. Frontend: regenerate the client; the widget is built in the dashboard (no link to a payables screen yet: part 07).

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_core_dashboard.py::test_accounts_payable_windows_and_totals`, `::test_accounts_payable_this_month_counts_the_calendar_month`, `::test_accounts_payable_empty` |
| R2 | `apps/core/tests/test_core_dashboard.py::test_accounts_payable_windows_and_totals` |
| R3 | `apps/core/tests/test_core_dashboard.py::test_accounts_payable_ignores_paid_and_cancelled` |
| R4 | `apps/core/tests/test_dashboard_scope.py::test_accounts_payable_ignores_other_companies` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [x] `docs/apps/core.md` updated; spec index updated
