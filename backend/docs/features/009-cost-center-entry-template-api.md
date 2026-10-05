---
summary: Spec: REST API and Django Admin for CostCenter (sub-conta) and EntryTemplate (histórico padrão), company-scoped, with a deletion rule and immutable parents; no frontend screen.
read-when: you touch cost centers or entry templates, add a finance endpoint, or need the pattern of the first finance API
skip-if: the ledger entries that use these templates → roadmap/phase-3-finance-base/04-current-account-ledger.md; company scoping → features/004-company-scoping.md; error codes → features/006-error-codes-and-contract.md
---
# 009 — Cost center and entry template API

**Status:** done · **Level:** full · **Roadmap:** phase 3 part 01 · **Apps:** finance, core (error handler), frontend (error messages + client) · **Frontend impact:** client regeneration (no new screen)

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Closes the carry-over of phase 2 part 04: serializers, viewsets, filters, URLs and Django Admin for `CostCenter` and `EntryTemplate` | the user (the plan) |
| 2026-10-05 | `DELETE` of a cost center that has entry templates answers **400** with its own code (not a 500); taking it out of use is `PATCH active=false` | the user |
| 2026-10-05 | API and Django Admin only: no screen in the Next frontend (the Stack keeps these bureaucratic registries in the Admin) | the user |
| 2026-10-05 | Flat resources `cost-centers` and `entry-templates`, like every other app (`condominium`, `cost_center` are filters, not nested URLs) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The deletion rule is a model rule (`CostCenter.delete()` raises a `ValidationError` with a code), and the API exception handler turns a Django `ValidationError` raised outside a serializer into the same 400 shape; reused by every later delete rule | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `CostCenter.condominium` and `EntryTemplate.cost_center` cannot change after creation (a model `clean()` rule): moving them would corrupt the ledger entries of phase 3 part 04 that group by them | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | No rule ties `EntryTemplate.active` to its cost center's `active` (an inactive cost center keeps its templates; the ledger parts decide what inactive means for posting) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Both models get a `Meta.ordering` (they had none, so pages were unstable); a state-only migration | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `EntryTemplate` is deletable in this part (nothing references it yet); phase 3 part 04 adds the protection when ledger entries point at it | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
Cost centers (the PDF's *SubConta*: the chart of accounts of a condominium) and entry templates (*Histórico*: the standard entry type, with its default cost center) exist as models since phase 2 but cannot be managed. The ledger parts of phase 3 need both.
- [x] R1 — `GET/POST /api/cost-centers/` and `GET/PATCH/DELETE /api/cost-centers/{id}/`; filters `condominium`, `active`; search `name`; paginated, stable order
- [x] R2 — `GET/POST /api/entry-templates/` and `GET/PATCH/DELETE /api/entry-templates/{id}/`; filters `cost_center`, `condominium` (of the cost center), `active`; search `name`; paginated, stable order
- [x] R3 — Both resources are company-scoped (spec 004): another company's records are 404, another company's `condominium`/`cost_center` id in a body is 400 `does_not_exist`, a superuser sees all
- [x] R4 — A cost center name is unique per condominium and an entry template name is unique per cost center, both answering 400 with the existing codes (`cost_center.name.duplicate_in_condominium`, `entry_template.name.duplicate_in_cost_center`); `admin_fee_incidence_percentage` outside 0–100 answers 400 (`percentage.out_of_range`)
- [x] R5 — `DELETE` of a cost center with entry templates answers **400** `cost_center.deletion.has_entry_templates` and deletes nothing; without templates it answers 204; the same rule holds in the Django Admin and in code that calls `delete()`
- [x] R6 — `condominium` of a cost center and `cost_center` of an entry template are fixed after creation: a `PATCH` that changes them answers 400 (`cost_center.condominium.immutable`, `entry_template.cost_center.immutable`); sending the same value is accepted
- [x] R7 — `ModelAdmin`s for both (company-scoped; the cost center admin lists its templates inline); the entries are audited (already registered in spec 005)
- [x] R8 — Both models have a `Meta.ordering` and the migration is state-only (no SQL)
- [x] R9 — The new error codes are registered and translated: the frontend message map compiles and the client is regenerated with the two new resources
- [x] R10 — `apps/finance.md`, `architecture/data.md`, `architecture/api.md` and the roadmap are updated

## E — Entities
No table changes. The models gain rules and ordering; there is no new column.
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.CostCenter` | `Meta.ordering = ("condominium__name", "name")`; `clean()`: `condominium` immutable once saved; `delete()`: refuses while it has entry templates | code `cost_center.condominium.immutable` on `condominium`; code `cost_center.deletion.has_entry_templates` (non-field) |
| `finance.EntryTemplate` | `Meta.ordering = ("cost_center__condominium__name", "cost_center__name", "name")`; `clean()`: `cost_center` immutable once saved | code `entry_template.cost_center.immutable` on `cost_center` |

New error codes (in `apps/finance/error_codes.py`; the frontend gets its Portuguese text):
| Code | Message (English) | Portuguese (frontend) |
|---|---|---|
| `cost_center.condominium.immutable` | The condominium of a cost center cannot be changed. | O condomínio de um centro de custo não pode ser alterado. |
| `cost_center.deletion.has_entry_templates` | This cost center has entry templates; deactivate it instead. | Este centro de custo tem modelos de lançamento; desative-o em vez de excluir. |
| `entry_template.cost_center.immutable` | The cost center of an entry template cannot be changed. | O centro de custo de um modelo de lançamento não pode ser alterado. |

## A — Approach
- **Same pattern as `condominiums`:** a `ModelSerializer` with `ModelRulesMixin` per resource (no rules in the serializer), a `ModelViewSet` with `CompanyScopedViewSetMixin`, `DjangoFilterBackend` + `QuerySearchFilter`, a `DefaultRouter` in `apps/finance/urls.py` included from `config/urls.py`. The package layout (`serializers/`, `views/`, one entity per file) is created for the app now, as `conventions/practices.md` asks when a stub gets its first feature.
- **Immutable parents as a model rule.** `clean()` loads the stored row (`type(self).objects.filter(pk=self.pk).values_list(...)`) when `not self._state.adding` and compares the foreign key; because it is `clean()`, the serializer (via `ModelRulesMixin`), the Admin and any `full_clean()` caller all enforce it. Alternative rejected: making the field read-only on update in the serializer (the Admin and code would bypass it).
- **Deletion rule in the model.** `CostCenter.delete()` raises `ValidationError(message, code=...)` when `entry_templates.exists()`. The database still has `PROTECT` as the last line (the cascade from a condominium deletion keeps working for cost centers without templates, and stays blocked by `PROTECT` when they have some). `apps/core/exception_handler.py` learns one thing: a Django `ValidationError` that escapes a view becomes the usual 400 `{errors: [...]}` (reusing the conversion of `ModelRulesMixin`), so a delete rule needs no view code.
- **Rejected:** `on_delete=CASCADE` for the templates (destroys what the ledger will reference); a soft-delete flag (`active` already is that).

## S — Structure
| File | Change |
|---|---|
| `apps/finance/models/cost_center.py`, `entry_template.py` | ordering, `clean()` rules, `delete()` rule; error codes |
| `apps/finance/error_codes.py` | the three codes above |
| `apps/finance/serializers/` (`cost_center_serializers.py`, `entry_template_serializers.py`, `__init__.py`) | new |
| `apps/finance/views/` (`cost_center_views.py`, `entry_template_views.py`, `__init__.py`) | new |
| `apps/finance/filters.py` | `EntryTemplateFilter` (`condominium` through the cost center) |
| `apps/finance/urls.py`, `config/urls.py` | routes `cost-centers`, `entry-templates` |
| `apps/finance/admin.py` | `CostCenterAdmin` (+ templates inline), `EntryTemplateAdmin`, company-scoped |
| `apps/core/exception_handler.py` | Django `ValidationError` → 400 shape |
| `apps/finance/migrations/0003_ordering.py` | `AlterModelOptions` (ordering), no SQL |
| `apps/finance/tests/` (`__init__.py`, `conftest.py`, `test_cost_centers.py`, `test_entry_templates.py`, `test_admin.py`) | tests |
| `frontend/lib/error-messages.ts`, `frontend/lib/api/generated/` | Portuguese texts for the new codes; regenerated client |
| `docs/apps/finance.md`, `architecture/data.md`, `architecture/api.md` | docs |
Endpoints:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/cost-centers/` | `?condominium=&active=&query=&page=&limit=` | paginated cost centers | scoped to the user's company |
| POST | `/api/cost-centers/` | `{condominium, name, active?}` | 201 cost center | `condominium` must be the user's company's |
| GET / PATCH | `/api/cost-centers/{id}/` | - / partial body | cost center | `condominium` cannot change |
| DELETE | `/api/cost-centers/{id}/` | - | 204, or 400 `cost_center.deletion.has_entry_templates` | |
| GET | `/api/entry-templates/` | `?cost_center=&condominium=&active=&query=&page=&limit=` | paginated entry templates | |
| POST | `/api/entry-templates/` | `{name, cost_center, active?, has_accumulation_history?, accumulate_to_balance?, is_subject_to_social_security?, admin_fee_incidence_percentage?}` | 201 | |
| GET / PATCH / DELETE | `/api/entry-templates/{id}/` | - / partial / - | entry template / 204 | `cost_center` cannot change |
Response fields use the model's names; `id` and timestamps are read-only; the cost center response carries `condominium` (id), the entry template response `cost_center` (id).

## O — Operations
Depends on phase 3a (company scoping, error codes, audit; all done).
1. Model rules, ordering, codes (`error_codes.py`) and their model tests; the migration (`makemigrations finance`, check `sqlmigrate` prints no SQL).
2. Exception handler conversion + test.
3. Serializers, filters, viewsets, URLs; API tests (CRUD, filters, search, scoping, rules).
4. Admin + admin tests.
5. Frontend: Portuguese texts for the codes (the compile fails until they exist), regenerate the client (`manage.py spectacular` → `npx orval --input`), `tsc`/`eslint`/`build`.
6. Docs; set the roadmap part and the spec to `done`.

## N — Norms
`conventions/practices.md` (rules only in models, codes with every rule, serializers hold no rule), `architecture/api.md` (flat resources, 404 / 400 for foreign ids), `conventions/naming.md` (codes `model.field.reason`; the deletion code is named after the rule: `cost_center.deletion.has_entry_templates`), `architecture/structure.md` (new API for an app: packages, one entity per file).

## S — Safeguards
- **Company isolation:** both models already declare `company_lookup` (`condominium__company`, `cost_center__condominium__company`); the viewsets use the scope mixin, the guard tests of spec 004 fail otherwise. A cost center or template of another company is a 404, as a foreign id a 400 `does_not_exist`.
- **Integrity:** the immutability and deletion rules are model rules (so the Admin and commands obey them); the unique constraints stay the database guard; `PROTECT` on `EntryTemplate.cost_center` stays.
- **Audit:** both models are registered (spec 005); every create, change and delete is logged with the actor.
- **Backward compatibility:** two new resources, no existing field changes; the client is regenerated; the Django `ValidationError` conversion only turns a former 500 into a 400.
- **Performance:** viewset querysets use `select_related("condominium")` / `select_related("cost_center__condominium")`; filters are on indexed foreign keys.
- **Failure modes:** deleting a condominium that has cost centers with templates is still refused by `PROTECT` at the database (a 500 today for a condominium delete; out of scope here, recorded in the Result if it shows up).

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_cost_centers.py::test_crud`, `::test_filters_and_search`, `::test_list_is_paginated_and_ordered`, `::test_requires_authentication` |
| R2 | `apps/finance/tests/test_entry_templates.py::test_crud`, `::test_filters_and_search` (including `condominium`), `::test_list_is_paginated_and_ordered`, `::test_requires_authentication` |
| R3 | `apps/finance/tests/test_cost_centers.py::test_other_company_is_404_and_foreign_condominium_is_does_not_exist`, `apps/finance/tests/test_entry_templates.py::test_other_company_is_404_and_foreign_cost_center_is_does_not_exist`; the guard tests of `apps/core/tests/test_company_scoping.py` (every model has `company_lookup`, every viewset uses the mixin) cover the new ones |
| R4 | `apps/finance/tests/test_cost_centers.py::test_duplicate_name_is_a_400_with_its_code`, `::test_same_name_is_allowed_in_another_condominium`, `apps/finance/tests/test_entry_templates.py::test_duplicate_name_is_a_400_with_its_code`, `::test_percentage_out_of_range_is_a_400` |
| R5 | `apps/finance/tests/test_cost_centers.py::test_delete_with_entry_templates_is_a_400`, `::test_delete_without_entry_templates_is_204`, `::test_a_cost_center_with_templates_is_deactivated_instead`, `::test_delete_rule_holds_for_code_that_calls_delete`, `::test_the_database_still_protects_a_bulk_delete`, `apps/core/tests/test_error_contract.py::test_django_validation_error_outside_a_serializer_is_a_400` |
| R6 | `apps/finance/tests/test_cost_centers.py::test_condominium_cannot_change`, `::test_same_condominium_is_accepted`, `apps/finance/tests/test_entry_templates.py::test_cost_center_cannot_change`, `::test_same_cost_center_is_accepted` |
| R7 | `apps/finance/tests/test_admin.py::test_admins_are_company_scoped`, `::test_cost_center_admin_lists_templates_inline`, `::test_models_are_audited` |
| R8 | `apps/finance/tests/test_cost_centers.py::test_ordering_is_declared`, `apps/finance/tests/test_entry_templates.py::test_ordering_is_declared`; `sqlmigrate finance 0003_ordering` printed no SQL |
| R9 | `apps/core/tests/test_error_codes.py` (codes registered, constraint and `ValidationError` guards, all green with the new codes); the TypeScript compile: before the Portuguese texts existed `tsc` failed with the missing keys, after adding them it passes; the client now has `cost-centers` and `entry-templates` |
| R10 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `mypy apps config` clean; `manage.py check` and `makemigrations --check --dry-run` clean; `sqlmigrate finance 0003` prints no SQL
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`manage.py spectacular` → `npx orval --input`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`)
- [x] `docs/apps/finance.md`, `architecture/data.md`, `architecture/api.md` updated; the carry-over of phase 2 part 04 closed
- [x] Roadmap part 01 of phase 3 (and phase 2 part 04's note) and the index in `features/README.md` updated
