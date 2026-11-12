---
summary: Spec 061 — everything that has a code is listed by it, smallest first; what belongs to a condominium or a person follows their code instead of their name.
read-when: you change the default ordering of a model or a list, or add a model with a code
skip-if: how a code is given (sequence, next free number) → architecture/data.md; the search ranking → apps/core.md
---
# 061 — Code ordering

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** condominiums, persons, billing, finance · **Frontend impact:** none (no API change)

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | Every list of something that has a code (condominium, person, billing event, catalog sub-conta, cost center) comes from the smallest code to the largest | user |
| 2026-10-30 | What belongs to a condominium or a person is ordered by *their* code (`condominium__code`, `person__code`) and not by their name: units, apportionment criteria, billing plans, billing documents, entry templates, cost centers, current accounts, billing rules, suppliers and the delinquency report | agent, to be confirmed |
| 2026-10-30 | The global search keeps the relevance rank first and breaks ties by code (it was by name) | agent, to be confirmed |
| 2026-10-30 | Rankings by amount (the delinquency chart) and by due date are not code lists and stay as they are | agent, to be confirmed |

## R — Requirements
- [x] R1 — `Meta.ordering` of `Condominium`, `Person`, `BillingEvent` and `CostCenterCatalogItem` is `("code",)`, and of `CostCenter` is `("condominium__code", "code")`
- [x] R2 — no model orders by `condominium__name` or `person__name` (the name of the owner of a code)
- [x] R3 — the search of condominiums, persons and sub-contas breaks rank ties by code; the delinquency report orders its rows and its condominiums by the condominium's code

## E — Entities
`No schema change.` Migrations only record the new `Meta.ordering` (`billing.0020`, `condominiums.0017`, `finance.0021`).

## S — Structure
`Meta.ordering` of the models above, the `search()` querysets (`rank`, then code), `current_account_views`, `condominium_billing_rules_views` and `services/build_delinquency_report.py`.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2 | `apps/core/tests/test_code_ordering.py` |
| R3 | `apps/billing/tests/test_delinquency_report.py::test_registered_documents_count_and_totals_are_per_condominium` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/architecture/data.md` updated; roadmap part/phase and the spec index updated (if applicable)
