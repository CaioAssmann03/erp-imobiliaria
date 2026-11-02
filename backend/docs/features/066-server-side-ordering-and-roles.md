---
summary: Follow-up of 064: the server says which unit links are current, gives each condominium person their roles and units, and orders the delinquency report, so the screens stop deciding that in the browser.
read-when: you wonder why `unit_people[].is_current`, `condominium-people[].unit_roles` or `?rows_order=` / `?condominiums_order=` on the delinquency report exist
skip-if: the original rule that lists never filter on the client → features/064-server-side-list-filters.md; the people/units endpoints in general → apps/condominiums.md; the report itself → apps/billing.md
---
# 066 — Server-side ordering and roles

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** condominiums, billing, persons · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-01 | Additive only: no existing field or default order changes; each criterion is a new field or a query param. | agent, to be confirmed |
| 2026-11-01 | The top-N of the delinquency charts stays a presentation `slice` of an ordered list that has one line per condominium; only the order moves to the API. | agent, to be confirmed |

## R — Requirements
Three screens still decided on the client what the API should answer: which unit links hold today (the browser compares dates in UTC, so after 21h in Brasília a link that ends today already looks ended), who the people of a condominium are and with which units (a screen grouped 100 links and 100 units by hand and cut the rest), and which boletos are the longest overdue (the "Mais atrasados" table sorted only the first page of rows).
- [x] R1 — Every link in `unit_people` of a unit carries `is_current` (no end date, or ending today or later, the server's date).
- [x] R2 — `condominium-people` items carry `unit_roles: [{role, units[]}]`: the owner and tenant roles the person holds with a **current** link in the scope asked (`?condominium=`, `?unit=`), owner first, with the unit names; `[]` without a scope.
- [x] R3 — `GET /billing-documents/delinquency/?rows_order=oldest` lists the longest overdue first across condominiums (default `condominium`: by condominium code, then the oldest due date).
- [x] R4 — `?condominiums_order=amount` orders `by_condominium` by the largest debt first (default `code`). An unknown value of either is a 400.

## E — Entities
No schema change.

## S — Structure
`UnitPerson.is_current(reference_date)` + `UnitPersonSerializer.is_current`; `CondominiumPersonSerializer` (`condominiums/serializers/condominium_person_serializers.py`, built on `persons` `PERSON_FIELDS`) and the prefetch in `CondominiumPeopleViewSet`; `DelinquencyPage.rows_order` / `condominiums_order` in `billing/services/build_delinquency_report.py`, validated by `DelinquencyQuerySerializer`.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `condominiums/tests/test_unit_person.py::TestIsCurrent` |
| R2 | `condominiums/tests/test_condominium_people.py::test_each_person_carries_the_roles_and_units_they_hold_in_the_scope` · `::test_the_unit_filter_limits_the_roles_to_that_unit` |
| R3 | `billing/tests/test_delinquency_report.py::test_rows_can_come_oldest_first_across_condominiums` |
| R4 | `billing/tests/test_delinquency_report.py::test_condominium_totals_can_come_largest_debt_first` · `::test_an_unknown_order_is_refused` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [x] `docs/apps/condominiums.md` and `docs/apps/billing.md` updated
