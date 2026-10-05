---
summary: Spec (lite): `?pending=` filter on the condominium and unit lists, one value per dashboard pendency, sharing the dashboard's definitions.
read-when: you touch the dashboard pendencies, the `pending` filter, or the queryset methods behind them
skip-if: the dashboard numbers themselves → apps/core.md; the other list filters → apps/condominiums.md; the accounts payable section → features/012-dashboard-accounts-payable.md
---
# 013 — Pending filters

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** condominiums, core, frontend · **Frontend impact:** client regeneration + filters in the lists + dashboard links

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Every row of the dashboard's *Pendências* opens the list already filtered, so the staff can edit the records | the user |
| 2026-10-05 | One `?pending=<value>` choice per resource instead of one parameter per pendency; an unknown value is a 400 | agent |
| 2026-10-05 | The dashboard and the filters share one definition: queryset methods (`Unit.objects.without_responsible`, `with_lease_ending_soon`, `UnitPerson.objects.leases_ending_soon`, `Condominium.objects.without_cost_centers`, `AdministrationContract.objects.overdue_adjustment_condominium_ids` / `upcoming_adjustment_condominium_ids`); the dashboard now calls them | agent |
| 2026-10-05 | "Locações terminando" opens the **units** that have such a tenant link (the dashboard counts links, a unit with two ending links counts once in the list) | agent |

## R — Requirements
- [x] R1 — `GET /api/condominiums/?pending=` accepts `without_cost_centers`, `inconsistent_apportionment`, `overdue_adjustment`, `upcoming_adjustment` (active condominiums, as in the dashboard)
- [x] R2 — `GET /api/units/?pending=` accepts `without_responsible`, `lease_ending`, `billing_blocked` (active units, as in the dashboard)
- [x] R3 — Any other value answers 400; the filters stay inside the user's company and combine with the other filters and search
- [x] R4 — The dashboard `pending` counters keep their values (the existing dashboard tests still pass)

## E — Entities
No schema change.

## S — Structure
`apps/condominiums/filters.py` (`CondominiumFilter`, `UnitFilter`), the views use `filterset_class`; queryset methods in `models/unit.py`, `unit_person.py`, `condominium.py`, `administration_contract.py`; `apps/core/views/dashboard_views.py` calls them.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/condominiums/tests/test_pending_filters.py::test_condominiums_without_cost_centers`, `::test_condominiums_with_inconsistent_apportionment`, `::test_condominiums_by_adjustment_window` |
| R2 | `apps/condominiums/tests/test_pending_filters.py::test_units_without_responsible`, `::test_units_with_lease_ending`, `::test_units_with_billing_blocked_counts_active_only` |
| R3 | `apps/condominiums/tests/test_pending_filters.py::test_condominium_pending_rejects_unknown_choice`, `::test_pending_filters_stay_inside_the_company` |
| R4 | `apps/core/tests/test_core_dashboard.py` (existing pending counter tests) |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [x] `docs/apps/condominiums.md` and `docs/apps/core.md` updated; spec index updated
