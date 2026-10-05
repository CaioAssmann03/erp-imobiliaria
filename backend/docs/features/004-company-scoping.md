---
summary: Spec: every logged-in user sees and writes only the data of their own company (User.company, Person.company, one scoping mixin, same-company link rules); superusers bypass.
read-when: you touch authorization, queryset scoping, Company/User/Person ownership, CPF/CNPJ uniqueness, or add a viewset/model that must be company-scoped
skip-if: roles and the customer portal → roadmap/phase-7-client-portal/01-portal-auth-and-permissions.md; token and login hardening → roadmap/phase-3a-prerequisites/08-auth-hardening.md; the general API rules → architecture/api.md
---
# 004 — Company scoping

**Status:** done · **Level:** full · **Roadmap:** phase 3a part 05 · **Apps:** accounts, core, persons, condominiums, finance · **Frontend impact:** client regeneration (the condominium form drops the company select)

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Company scoping before phase 3; roles stay for phase 7 (gap #2) | the user |
| 2026-10-05 | A superuser bypasses the scope (support, Django Admin) | the user |
| 2026-10-05 | `User.company` is required for every user, superuser included; one company per user | the user |
| 2026-10-05 | `Person` belongs to a company (`Person.company`); the same real person in two companies is two records | the user |
| 2026-10-05 | `createsuperuser` and the deploy entrypoint use the seeded company (`core.0002`) when it is the only one; with several they need `DJANGO_SUPERUSER_COMPANY` | the user |
| 2026-10-05 | CPF/CNPJ unique per company: `company` denormalized onto `PeopleIndividual`/`PeopleLegal` + `UniqueConstraint`, kept equal to `person.company` by `clean()` | the user |
| 2026-10-05 | `company` is read-only in the API; an id of another company answers 400 "does not exist" | the user |
| 2026-10-05 | The Django Admin applies the same scope to non-superuser staff | the user |
| 2026-10-05 | `/api/companies/`: staff lists, reads and edits only their own company; create and delete are superuser-only; a superuser sees all | the user |
| 2026-10-05 | Linked records must share a company, enforced in the models' `clean()` (advisor, unit person) | the user |
| 2026-10-05 | Each model declares its path to the company in `company_lookup`; a guard test fails for a model with none | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `accounts` now depends on `core` (`User.company`); layers become `core ← accounts`; `core` must never import `accounts` | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | A superuser who creates records through the API creates them in their own company; other companies are managed in the Django Admin | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Migrations are new files (not edits): add nullable `company`, backfill with the seeded company (fail if rows exist and several companies exist), then NOT NULL | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `rg` is also unique **per company** (`UniqueConstraint(company, rg)` when `rg` is set): the old global `unique` on `rg` would block the same real person in two companies, the same reason as CPF | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | A duplicate CPF/CNPJ/RG inside one company is a 400 reported as a non-field error under `people_individual`/`people_legal` (it now comes from a multi-field constraint, not a field `unique`); the UI shows it as the general message | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | The migrations are split in two per app (`0002` adds the nullable column and backfills, `0003` makes it required and adds the constraints) because PostgreSQL refuses to alter a table after updating it in the same transaction | agent, found while implementing |
| 2026-10-05 | The `?company=` filter on the condominium list stays (useful to a superuser; for staff it is redundant with the scope) | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
Today any logged-in admin reads and writes every company's data, and a person of one company can be linked to a condominium of another. Phase 3 adds money, so ownership must exist first.
- [x] R1 — `User.company` is required (NOT NULL); `createsuperuser` and the entrypoint fill it as decided; `UserAdmin` shows and edits it
- [x] R2 — `Person.company` exists (NOT NULL); `PeopleIndividual` and `PeopleLegal` carry a `company` equal to `person.company`; CPF is unique per company and CNPJ is unique per company (the same document may exist in two companies)
- [x] R3 — Every model of the project declares `company_lookup` (or is on an explicit exempt list); a test fails for a new model that has neither
- [x] R4 — For non-superusers every list, retrieve, update and delete is limited to the user's company; a record of another company answers 404; a superuser sees all
- [x] R5 — Records created through the API take the user's company; a `company` sent in the body is ignored (read-only field)
- [x] R6 — A related id (advisor, person, unit, block, condominium...) of another company answers 400 "does not exist", never 403, and never confirms it exists elsewhere
- [x] R7 — `clean()` rejects links across companies (`Condominium.advisor`, `UnitPerson.person` against `unit.condominium.company`, `PeopleIndividual/Legal.company` against `person.company`); the API answers 400 on the right field
- [x] R8 — `/api/companies/`: staff sees and edits only their own company; POST and DELETE need a superuser (403); a superuser sees all
- [x] R9 — The dashboard counters and the global search are computed over the user's company only (a superuser: all companies)
- [x] R10 — The Django Admin limits non-superuser staff to their company (querysets and the choices of foreign-key fields)
- [x] R11 — `seed_demo` creates its data in the seeded company and works with the required `Person.company`
- [x] R12 — The frontend no longer shows or sends the company in the condominium form; the client is regenerated and callers fixed

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `accounts.User` | add field | `company = ForeignKey(core.Company, PROTECT, related_name="users")`, NOT NULL; `UserManager.create_user/create_superuser` default to the seeded company when it is the only one |
| `persons.Person` | add field | `company = ForeignKey(core.Company, PROTECT, related_name="people")`, NOT NULL, indexed |
| `persons.PeopleIndividual` | add field, change constraint | `company` (denormalized, NOT NULL); `cpf` loses its global `unique`; `UniqueConstraint(company, cpf)`; `clean()`: `company == person.company` |
| `persons.PeopleLegal` | add field, change constraint | `company`; `cnpj` loses its global `unique`; `UniqueConstraint(company, cnpj)`; same `clean()`. `ie` stays as it is |
| `condominiums.Condominium` | rules | `company` read-only in the API; `clean()`: `advisor.company == company` |
| `condominiums.UnitPerson` | rules | `clean()`: `person.company == unit.condominium.company` |

`company_lookup` (path from the model to its company), declared on every model:
| Model | `company_lookup` |
|---|---|
| `Company` | `id` (compared with the user's company) |
| `User` | `company` |
| `Person`, `PeopleIndividual`, `PeopleLegal`, `Condominium` | `company` |
| `Address`, `AdministrationContract`, `BillingRules`, `Block`, `Unit`, `CostCenter` | `condominium__company` (`Address`: reverse `condominium__company`) |
| `UnitPerson` | `unit__condominium__company` |
| `EntryTemplate` | `cost_center__condominium__company` |

## A — Approach
- **One place decides.** `apps/core/scoping.py` holds `scope_to_company(queryset, user)` (a no-op for superusers, otherwise `filter(**{model.company_lookup: user.company_id})`) and three adapters that only call it:
  `CompanyScopedViewSetMixin` (`get_queryset`), `CompanyScopedPrimaryKeyRelatedField` (its `get_queryset`, so a foreign id of another company is "does not exist"), `CompanyScopedAdminMixin` (`get_queryset` and `formfield_for_foreignkey`).
  Viewsets and admins add the mixin; no viewset writes its own company filter. The dashboard and the search call `scope_to_company` explicitly for each model they read.
- **The company never comes from the client.** `company` is `read_only` in the serializers; `create` takes it from `request.user.company` (nested `people_individual` / `people_legal` copy it from their person).
  Alternative rejected: a `company` field the client sends and the server validates (it invites cross-company writes and enumeration).
- **Same-company links are model rules** (`clean()` + the constraint where the database can hold it), as `conventions/practices.md` §2 asks; the scope hides foreign records in the API, the model rule also holds for the admin, commands and tasks.
- **Why denormalize `company` onto `PeopleIndividual`/`PeopleLegal`:** a unique CPF per company needs the company in the same table; the copy is kept equal to `person.company` by `clean()`.
  Alternative rejected: validating uniqueness only in `clean()` (no database guard, the race of gap #21 would apply to documents too).
- **A guard test closes the door for the future:** it walks every model of `apps.*` and fails when one has no `company_lookup` and is not on the exempt list. A new viewset without the mixin fails a second test that walks the router.
- **Superuser** is checked once, in `scope_to_company` (`user.is_superuser`), never in views.

## S — Structure
Files to create or change (paths after phase 3a part 02, the app rename):
| File | Change |
|---|---|
| `apps/core/scoping.py` | new: `scope_to_company`, `CompanyScopedViewSetMixin`, `CompanyScopedPrimaryKeyRelatedField`, `CompanyScopedAdminMixin` |
| `apps/core/serializers/model_rules.py` | `ModelRulesMixin` sets `serializer_related_field = CompanyScopedPrimaryKeyRelatedField` |
| `apps/accounts/models/user.py` | `company` FK, `UserManager` (`create_superuser` default company); `apps/accounts/admin.py`: field in the forms |
| `apps/persons/models/person.py`, `people_individual.py`, `people_legal.py` | `company` fields, constraints, `clean()` |
| `apps/persons/serializers/*`, `apps/persons/views/person_views.py`, `apps/persons/admin.py` | company read-only, set on create, mixins |
| `apps/condominiums/models/condominium.py`, `unit_person.py` | `clean()` rules; `company_lookup` on every model of the app |
| `apps/condominiums/serializers/*`, `apps/condominiums/views/*`, `apps/condominiums/admin.py` | company read-only, mixins |
| `apps/finance/models/*`, `admin.py` | `company_lookup` (no API yet) |
| `apps/core/views/company_views.py`, `apps/core/serializers/company_serializers.py` | `/api/companies/` rules (own company; POST/DELETE superuser-only) |
| `apps/core/views/dashboard_views.py`, `apps/core/views/search_views.py` | scope every query |
| `apps/core/management/commands/seed_demo.py` | `Person.company`, user company |
| `apps/*/migrations/` | new migrations (see Operations) |
| `backend/entrypoint.sh`, `.env.example` | optional `DJANGO_SUPERUSER_COMPANY` |
| `apps/core/tests/test_company_scoping.py` + per-app tests | isolation matrix and guard tests |
| `frontend/` | remove the company select (`IdentificationSection.tsx`, `lib/schemas/condominium.ts`); regenerate `lib/api/generated` |

Endpoints (no new routes; behavior changes):
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | every list/detail | - | only the user's company (superuser: all) | another company's id: 404 |
| POST | `/api/persons/`, `/api/condominiums/` | no `company` | record with `company` (read-only) | company = user's company |
| PATCH/DELETE | every detail | - | 404 for another company's record | |
| POST/PATCH | any with a foreign key | an id of another company | 400 `{field: ["... does not exist"]}` | |
| GET/PATCH | `/api/companies/`, `/api/companies/{id}/` | - | staff: own company only | |
| POST/DELETE | `/api/companies/` | - | 403 for staff | superuser only |

## O — Operations
Depends on phase 3a part 02 (renamed apps, one clean `0001` per app) and part 01 (hosting known).
1. `core/scoping.py` with its unit tests (queryset, field, admin adapters).
2. Models: `company_lookup` on every model; `User.company` and manager; `Person.company`; the denormalized `company` on `PeopleIndividual`/`PeopleLegal`; `clean()` rules; constraints.
3. Migrations, per app: add the field nullable → `RunPython` backfill (the seeded company; abort with a clear message when rows exist and there are several companies) → `AlterField` NOT NULL; then replace the global uniques by the per-company constraints.
4. Serializers (read-only `company`, set on create, scoped related field), viewsets (mixin), admin (mixin), `/api/companies/` rules, dashboard and search.
5. `seed_demo`, `entrypoint.sh`, `.env.example`.
6. Tests (see Test plan), then docs.
7. Frontend: remove the company select, regenerate the client (`cd frontend && npm run generate:api`), fix callers.

## N — Norms
`conventions/practices.md` §2–3 (rules only in models, `ModelRulesMixin`), `architecture/api.md` (errors, read-only fields), `conventions/naming.md` (intention-revealing: `scope_to_company`, `company_lookup`; no flag arguments).
Exception: `core/scoping.py` is a module of functions and small classes (not an entity), so the one-entity-per-file rule does not apply.

## S — Safeguards
- **Enumeration:** a record of another company is 404 on detail and 400 "does not exist" as a related id, the same answer as a missing id; no 403 on data.
- **Superuser bypass is explicit and single:** only `is_superuser`, only inside `scope_to_company`; `is_staff` does not bypass. Every superuser write is covered by the audit trail once phase 3a part 06 lands.
- **Personal data (LGPD):** persons no longer cross companies; the global search and the dashboard are scoped, so they cannot be used to find another company's CPF.
- **Data integrity:** `UniqueConstraint(company, cpf|cnpj)` is the database guard; `on_delete=PROTECT` on every company FK (a company with users or people cannot be deleted); the same-company rules are model rules, so the admin and commands obey them.
- **Backward compatibility:** API paths and existing field names are unchanged; `company` becomes read-only on the condominium and appears on persons (additive); the client must be regenerated. The global uniqueness of CPF/CNPJ is relaxed to per company on purpose.
- **Migration risk:** the backfill refuses to guess when several companies exist; the staging database is recreated in phase 3a part 02, so no real data is touched.
- **Performance:** scoping adds a join through at most three foreign keys (`unit__condominium__company`); the FKs are indexed. Dashboard counters keep their current queries with one extra filter.
- **Known limit:** the race on the sum caps (gap #21) is unchanged and out of scope.

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/accounts/tests/test_user_company.py::test_user_requires_company`, `::test_create_superuser_uses_seeded_company`, `::test_with_several_companies_the_company_must_be_given`, `::test_superuser_company_comes_from_the_environment_by_id`, `::test_superuser_company_comes_from_the_environment_by_cnpj`, `::test_the_admin_forms_show_the_company` |
| R2 | `apps/persons/tests/test_company_ownership.py::test_same_cpf_is_allowed_in_two_companies`, `::test_same_cpf_is_rejected_in_one_company`, `::test_same_cpf_in_one_company_is_a_400_in_the_api`, `::test_same_cnpj_is_allowed_per_company_only`, `::test_same_rg_is_unique_per_company`, `::test_document_company_must_match_the_person` |
| R3 | `apps/core/tests/test_company_scoping.py::test_every_model_declares_company_lookup`, `::test_every_company_lookup_resolves_to_a_company`, `::test_every_viewset_uses_the_scope_mixin` |
| R4 | `apps/core/tests/test_company_scoping.py::test_list_is_limited_to_own_company`, `::test_other_company_record_is_404_on_retrieve_update_delete`, `::test_superuser_sees_all_companies` (each parametrized over person, condominium, block, unit, unit-person) |
| R5 | `apps/persons/tests/test_company_ownership.py::test_create_takes_company_from_user`, `::test_company_in_the_body_is_ignored`, `::test_patch_cannot_move_a_person_to_another_company`, `apps/condominiums/tests/test_company_links.py::test_create_takes_the_company_from_the_user`, `::test_company_in_the_body_is_ignored`, `::test_patch_cannot_move_a_condominium_to_another_company` |
| R6 | `apps/core/tests/test_company_scoping.py::test_foreign_condominium_id_on_a_unit_is_does_not_exist`, `::test_foreign_advisor_is_does_not_exist`, `::test_foreign_person_and_unit_on_a_link_are_does_not_exist`, `::test_foreign_block_on_a_unit_is_does_not_exist`, `::test_a_foreign_id_looks_like_a_missing_one` |
| R7 | `apps/condominiums/tests/test_company_links.py::test_advisor_must_share_the_company`, `::test_unit_person_must_share_the_company`, `apps/persons/tests/test_company_ownership.py::test_document_company_must_match_the_person` (the API answers for foreign ids are the R6 tests) |
| R8 | `apps/core/tests/test_company_api.py::test_staff_sees_only_own_company`, `::test_staff_can_patch_own_company`, `::test_staff_cannot_create_a_company`, `::test_staff_cannot_delete_a_company`, `::test_superuser_creates_and_sees_all` |
| R9 | `apps/core/tests/test_dashboard_scope.py::test_counters_ignore_other_companies`, `::test_counters_count_own_company_only`, `::test_search_hides_other_company_records` |
| R10 | `apps/core/tests/test_admin_scope.py::test_staff_admin_lists_only_own_company`, `::test_fk_choices_are_scoped`, `::test_company_choice_is_the_users_company_for_staff` |
| R11 | `apps/core/tests/test_core_seed_demo.py::test_seed_assigns_the_company_to_people_and_documents` |
| R12 | gap: the frontend has no test suite; verified by `npx tsc --noEmit`, `npx eslint .` and `npm run build` (all pass after the regenerated client). The condominium form was not exercised in a browser |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`npm run generate:api`)
- [x] `docs/apps/accounts.md`, `core.md`, `persons.md`, `condominiums.md`, `architecture/data.md` (relations, constraints), `architecture/overview.md` (layers: `core ← accounts`), `architecture/quality.md` (authorization row), `architecture/api.md` updated; gap #2 deleted from `docs/known-gaps.md`
- [x] Roadmap part 05 and the phase 3a table updated; index in `features/README.md` updated
