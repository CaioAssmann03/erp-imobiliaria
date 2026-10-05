---
summary: Spec of the change that moved every business rule into the models (validators, clean(), constraints) and made serializers run them via ModelRulesMixin.
read-when: you wonder how business rules are enforced or how the model-rules mixin was designed
skip-if: you need the day-to-day pattern → conventions/practices.md; you need the process → features/README.md
---
# 002 — Business rules only in models

**Status:** done · **Level:** full · **Roadmap:** none (retro-spec) · **Apps:** core, condominiums, persons, finance · **Frontend impact:** none

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| - | Retro-spec: decisions are described in *Approach* | - |

## R — Requirements
Business rules were split between constraints (database) and hand-written `validate` methods in serializers (duplicated logic, two places to change). Rule: **every business rule is
written in the model**; serializers, views and services only call it.
- [x] Each former serializer rule exists in the model as a field validator or a `clean()` check (plus its constraint, same message)
- [x] Serializers contain no business rule; they run the model's rules and return 400
- [x] Domain calculations used by the dashboard are model/queryset methods
- [x] API behaviour unchanged for valid input; rule violations still 400 on the same fields

## E — Entities
| Entity | Change |
|---|---|
| `AdministrationContract` | `clean()` (fixed ⇒ amount, variable ⇒ percentage and basis, floor ≤ ceiling); `next_adjustment_date()`, `is_adjustment_overdue(reference_date)` |
| `BillingRules` | field validators `validate_due_day`, `validate_percentage` |
| `Unit` | validators `validate_ideal_fraction`, `validate_non_negative`; `clean()` block belongs to condominium; `UnitQuerySet.inconsistent_apportionment_condominium_ids()` |
| `UnitPerson` | validator `validate_percentage`; `clean()` (owner needs percentage, tenant none, dates); `UnitPersonQuerySet.current(reference_date)`, `is_current(reference_date)` |
| `EntryTemplate` | validator `validate_percentage` |
No schema change (migrations only record the new validators: `condominiums.0002`, `finance.0002`).

## A — Approach
- Field-level rules → validators; multi-field/multi-record rules → `clean()` raising `ValidationError({field: msg})`; constraints stay as the database guard.
- `ModelRulesMixin` (`core/serializers/model_rules.py`): builds the candidate record from the validated input (copy of the instance on update), excludes relations without a model value, runs `full_clean()`,
  converts Django's `ValidationError` into a DRF 400. `full_clean()` also validates constraints (even conditional unique ones) and uniqueness, which removes a former 500 risk.
- Person documents: the parent serializer builds the candidate from the existing document row and runs `run_model_rules`, so a person's own CPF/CNPJ is not a duplicate.
- Rejected: keeping duplicated rules in serializers (drift); validating only in `save()` (DRF would need to catch it anyway).

## S — Structure
`apps/core/serializers/model_rules.py`, `apps/core/validators/percentage.py`, `apps/core/dates.py`, `apps/condominiums/validators.py`; model files in `condominiums` and `finance`;
all `*_serializers.py` of `condominiums`, `persons/serializers/person_serializers.py`, `core/serializers/company_serializers.py`; `core/views/dashboard_views.py` (calls model methods).

## O — Operations
1. Validators and `clean()` in models; constraints kept. 2. `ModelRulesMixin`. 3. Serializers: remove `validate`/`validate_*` rules, add the mixin. 4. Model/queryset methods and dashboard refactor.
5. Migrations (validators). 6. Tests rewritten per layer. 7. Docs.

## N — Norms
New norm in `conventions/practices.md` §2–3 and `AGENTS.md`: business rules only in models.

## S — Safeguards
Extra queries per write (uniqueness checks); acceptable. Writers that bypass serializers must call `full_clean()` (known-gaps.md #21). Nested objects validate as complete records (#22).

## Test plan (done)
Model rule tests without database (`clean()`, validators); serializer tests proving the model's error reaches the right field as 400; database constraint tests; model/queryset method tests;
API payload tests unchanged and passing; full suite on PostgreSQL (179 tests).

## Docs updated
`AGENTS.md`, `conventions/practices.md`, `architecture/api.md`, `architecture/data.md`, `architecture/overview.md` (decisions), `architecture/structure.md`, `architecture/quality.md`, `apps/core|condominiums|persons.md`, `known-gaps.md`.
