---
summary: Spec: an automatic sequential `code` (the "ID") on condominiums and people, searchable in list and global search, plus `Person.modules` to keep condominium people and rental people apart.
read-when: you touch IDs/codes, searching by number, the person pickers, or which module (condominiums, rentals) a person belongs to
skip-if: the ledger entry number (`registry`) → features/history.md (spec 014); person documents and uniqueness → apps/persons.md; the rentals module itself → roadmap/phase-8-rentals/README.md
---
# 019 — Sequential IDs and people by module

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** core, persons, condominiums, frontend · **Frontend impact:** client regeneration

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-15 | The "ID" is an automatic sequential number (1, 2, 3…), unique per kind of record, that never changes and is never reused; it is shown on screens and accepted by every search. The UUID stays as the internal key | the user |
| 2026-10-15 | Owners and tenants use the **person's** ID: one number per person; "owner" and "tenant" are roles (filters), not separate registries | the user |
| 2026-10-15 | One person record can act in Condominiums and in Rentals: it is released to Rentals and, until then, does not appear there; the same holds the other way round | the user |
| 2026-10-15 | Scope now: IDs of condominiums and people plus the module marking on people. The IDs of rental properties, owners and tenants are born with the Rentals module (phase 8) | the user |
| 2026-10-15 | A unit has **no ID**: it is identified by its condominium and its number (`name`, plus the block when there is one). The first delivery numbered units too, because the option the user approved named them; after seeing it the user said units do not need an ID, and it was removed before the merge | the user |
| 2026-10-15 | Existing records are numbered by creation order; existing people are marked `condominiums`; a number typed in a search puts the record with that ID first, from one digit; `Unit.registration_number` (the registry-office "matrícula") stays as it is | agent, stated in chat on 2026-10-15; confirmed by the user on 2026-10-15 |
| 2026-10-15 | The field is `code` (a whole number in the database and the API); the screens label it "ID". One global sequence per kind of record, like `CurrentAccountEntry.registry`, not one per company: with a single company the numbers are consecutive, and per-company counters would need a locked counter table | agent; confirmed by the user on 2026-10-15 |
| 2026-10-15 | `Person.modules` is a PostgreSQL array of `condominiums` / `rentals` with database constraints (not empty, only known values). Rejected: two booleans (each new module changes the schema), a join table (the database cannot guarantee "at least one"), one people table per module (the same CPF would exist twice and drift) | agent; confirmed by the user on 2026-10-15 |
| 2026-10-15 | The only model rule that crosses modules is on `UnitPerson`: a person is linked to a unit only if they belong to `condominiums`, checked when the link is created or its person changes. A person who later leaves `condominiums` keeps the links they have, and `persons` does not look into `condominiums` (it would invert the dependency). There is no rule on `Condominium.advisor` or `Supplier.person`: any person of the company can hold them, but the condominium pickers list only `condominiums` people | agent; confirmed by the user on 2026-10-15 |
| 2026-10-15 | No screen control for `modules` while Rentals has no screens: new people default to `["condominiums"]`, the persons list, the person picker and the header search send `module=condominiums`, and the release to Rentals gets its button with phase 8 | agent; confirmed by the user on 2026-10-15 |

## R — Requirements
Records are identified only by a UUID, which nobody can type, and the searches match names, e-mails and documents, while the business always looks a record up by a short ID. The people of the Condominiums module and of the future Rentals module must not mix: a condômino must not appear in Rentals. Out of scope: IDs for suppliers, accounts payable, blocks and other records; the Rentals models and screens (phase 8); access profiles (this separates lists, searches and what can be linked, it is not access control).
- [ ] R1 — `Condominium` and `Person` have a `code`: a whole number taken from the record's own PostgreSQL sequence, unique, assigned by the database on insert, never reused (not after a delete, not after a rollback), starting at 1 on an empty table; validating a record (`full_clean()`) never consumes a number
- [ ] R2 — `code` is read-only in the API and in the Admin: a client that sends it is ignored, and nothing changes it after the record exists
- [ ] R3 — The migration gives the existing rows their number by creation order (`created_at`, then `id`), moves each sequence past the highest number, marks every existing person `["condominiums"]`, and can be reversed
- [ ] R4 — `code` is in the responses of `condominiums` and `persons` (list and detail), in the person nested in a unit link (`person_detail`) and in every person and condominium item of the global search; a unit carries none
- [ ] R5 — In the list search (`?query=`) of `persons` and `condominiums`, a term made only of digits (up to 18) also matches the record whose `code` is that number, and that record comes first; any other term behaves as before; no term causes a 500
- [ ] R6 — In the global search (`/api/search/?q=`), a term made only of digits (1 to 18, no punctuation) puts the record with that `code` first in the people and condominiums groups; a one-digit term returns only that match (so no unit, which is found by its number); two or more digits keep the current text and document matching after the exact match; a term with punctuation (CPF/CNPJ) behaves as before
- [ ] R7 — `Person.modules` lists the modules the person belongs to (`condominiums`, `rentals`): at least one, no unknown value, default `["condominiums"]`; the persons API reads and writes it; an empty list is a 400 `person.modules.empty` (model rule and database constraint)
- [ ] R8 — `GET /api/persons/?module=condominiums` (or `rentals`) lists only the company's people whose `modules` contain it; without the parameter nothing changes; an unknown module is a 400; `/api/search/` takes the same `module` for its `persons` group
- [ ] R9 — A person can be linked to a unit only if their `modules` contain `condominiums`: creating a link, or changing its person, to a rentals-only person is a 400 `unit_person.person.not_in_condominiums`; links that already exist keep working if the person later leaves `condominiums`
- [ ] R10 — One person, one `code`: releasing a person to `rentals` (adding it to `modules`) never changes the `code`
- [ ] R11 — Frontend: the lists of condominiums and people show an "ID" column and their edit pages show the ID read-only (a unit shows none); the owners and tenants of a unit show the person's ID; the header search and the person picker take a number from one digit and show the ID of each result; the persons list, the person picker and the header search send `module=condominiums`; the three new error codes have Portuguese texts
- [ ] R12 — Docs: `apps/persons.md`, `apps/condominiums.md`, `apps/core.md`, `architecture/data.md`, `architecture/api.md`, the frontend docs and the phase 8 notes describe the ID and the modules; on close the spec is condensed into `features/history.md`

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `Condominium`, `Person` | new field | `code = sequential_code_field("<entity>_code_seq")`: `BigIntegerField(unique=True, editable=False, db_default=nextval(sequence))`; the sequences `condominium_code_seq` and `person_code_seq` are created by the migrations |
| `PersonModule` | new enum | `TextChoices` at the module level of `persons/models/person.py` (the constraint below cannot reach a class nested in `Person`), exported by `apps.persons.models`: `CONDOMINIUMS = "condominiums"`, `RENTALS = "rentals"` |
| `Person` | new field | `modules = ArrayField(CharField(max_length=20, choices=PersonModule.choices), default=default_modules, db_default=["condominiums"], blank=True)`; `blank=True` lets an empty list reach `clean()`, which reports it with the module's own code; the database default keeps writers that do not know the field working |
| `Person` | constraints and rule | `person_modules_not_empty` and `person_modules_known` (`CheckConstraint`); `clean()` holds the single rule (empty list) with `PersonError.MODULES_EMPTY`; unknown values are refused by the field's choices (400 `invalid_choice`) and by the constraint (`PersonError.MODULES_UNKNOWN`) |
| `PersonError` | new `errors/person.py` | `MODULES_EMPTY = ("person.modules.empty", "A person must belong to at least one module.")`, `MODULES_UNKNOWN = ("person.modules.unknown", "The person has an unknown module.")` |
| `UnitPersonRules` | new rule | `person_is_not_from_condominiums` on field `person`, true when the link is new or its person changed and the person's `modules` lack `condominiums`; `UnitPersonError.PERSON_NOT_IN_CONDOMINIUMS = ("unit_person.person.not_in_condominiums", "The person is not registered for condominiums.")` |
| `core` | new helper | `apps/core/models/sequential_code.py`: `sequential_code_field(sequence)` and the abstract `SequentialCodeMixin` whose `validate_unique` skips `code` (as `CurrentAccountEntry` does for `registry`) |

## A — Approach
- **The ID is a database sequence, like the statement's `registry` (spec 014).** A sequence hands out numbers without locks, two simultaneous inserts never get the same one, and a number is never given twice; only a rolled-back insert leaves a hole. `validate_unique` skips `code` so `full_clean()` does not draw a number. The helper in `core` keeps the three models from copying that code; `registry` is left as it is. Rejected: `MAX(code) + 1` (races), a counter table per company (a locked row on every insert, no gain with a single company), a typed code (duplicates and mistakes).
- **One sequence per kind of record, global.** Condominium 1 and person 1 can coexist: the searches show the group (person, condominium) next to the number. If several companies ever need to start at 1, per-company numbering becomes a new spec.
- **Existing rows are numbered by a hand-written migration**, because a plain `AddField` with `db_default` would number them in physical order. Steps per app, in this order: create the sequence; add `code` nullable; fill it with `row_number() OVER (ORDER BY created_at, id)`; `setval` the sequence to the highest number (or to 1 when the table is empty); make the column `NOT NULL`, unique, with the `nextval` default. Reversible.
- **List search.** `QuerySearchFilter` gets an optional view attribute `search_code_field` (`"code"` in the three viewsets). A term of only digits (up to 18, so it fits a `bigint`) also matches `code == number`, and when such a term is present the exact match is ordered first, before the view's own ordering. The text fields are still searched, so a name or CPF containing those digits shows up after it.
- **Global search.** `classify_term` also reports the number when the term is only digits; the three searches add an exact-match rank above the current ranks; a one-digit term skips the name and document matching (it would match almost everything).
- **Modules as a set on one record.** A person is a single record with one `code` and one CPF/CNPJ; `modules` says where the person can be used. The separation holds where people are *chosen* (lists, pickers and the global search take `module`) and where they are *saved* (the `UnitPerson` rule; the rentals models of phase 8 will carry the same rule for `rentals`). Rejected: filtering only in the frontend (one forgotten filter would mix the lists again).
- **Releasing a person to Rentals** is a change of `modules` through the existing PATCH; its button belongs to phase 8, when Rentals has screens.

## S — Structure
| File | Change |
|---|---|
| `apps/core/models/sequential_code.py` (new), `apps/core/models/__init__.py` | `sequential_code_field(sequence)` and `SequentialCodeMixin` |
| `apps/persons/models/person.py`, `apps/persons/errors/person.py` (new), `apps/persons/errors/__init__.py` | `Module`, `code`, `modules`, the two constraints, `clean()`; `PersonError` |
| `apps/persons/migrations/0005_person_code_and_modules.py` | hand-written: sequence, backfill by creation order, `modules` for the existing people |
| `apps/persons/serializers/person_serializers.py`, `filters.py`, `views/person_views.py`, `admin.py` | `code` (read-only) and `modules`; `?module=`; `search_code_field`; Admin columns and read-only `code` |
| `apps/condominiums/models/condominium.py`, `migrations/0004_condominium_code.py` | `code` on `Condominium`; the migration |
| `apps/condominiums/models/rules/unit_person.py`, `errors/unit_person.py` | the `UnitPerson` rule and `PERSON_NOT_IN_CONDOMINIUMS` |
| `apps/condominiums/serializers/condominium_serializers.py`, `views/condominium_views.py`, `admin.py` | `code` read-only, `search_code_field`, Admin |
| `apps/core/api/filters.py`, `apps/core/api/codes.py` (new) | `QuerySearchFilter` with `search_code_field`; `code_from_term` decides what is an ID |
| `apps/core/views/search/term.py`, `ranking.py`, `persons.py`, `condominiums.py`, `units.py`, `search_views.py`; `apps/core/serializers/search_serializers.py` | digits-only term, exact-code rank, `module`, `code` in the people and condominium items; `units.py` finds a unit by its number only |
| `apps/core/seed/` | no change expected (the defaults apply); check that `seed_demo` still runs |
| tests | `apps/persons/tests/test_person_code.py`, `test_person_modules.py`; `apps/condominiums/tests/test_codes.py` and additions to `test_unit_person.py`; `apps/core/tests/search/test_search_by_code.py`; `apps/core/tests/infrastructure/test_sequential_code.py`, `test_query_search_filter.py`, `test_code_migrations.py` |

Endpoints (existing ones; nothing new is routed):
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/persons/` | `?module=condominiums` or `rentals` (new); `?query=` also matches the ID | each person gains `code` and `modules` | without `module`, all the company's people; unknown `module` is a 400 |
| POST, PATCH | `/api/persons/`, `/api/persons/{id}/` | `modules` optional (default `["condominiums"]`) | `code` read-only | empty `modules` is a 400 `person.modules.empty` |
| GET | `/api/condominiums/` | `?query=` also matches the ID | each item gains `code` | company-scoped as today; `/api/units/` is unchanged (no ID) |
| POST, PATCH | `/api/unit-people/` | - | - | rentals-only person is a 400 `unit_person.person.not_in_condominiums` |
| GET | `/api/search/` | `q` digits-only is an ID lookup; `module` optional (filters `persons`) | every item gains `code` | the minimum length of a digits-only term becomes 1 |

Frontend (under `frontend/`, paths relative to it):
| File | Change |
|---|---|
| `lib/api/generated/` | regenerated with `npm run generate:api` (backend running), never edited |
| `lib/error-messages.ts` | Portuguese texts for `person.modules.empty`, `person.modules.unknown` and `unit_person.person.not_in_condominiums` |
| `lib/search-index.ts` (+ `tests/search-index.test.mjs`), `app/(dashboard)/_components/shell/GlobalSearch.tsx`, `shell/search/use-search-results.ts`, `shell/search/SearchResults.tsx` | a digits-only term is searchable from one digit; results show the ID; the request sends `module=condominiums` |
| `lib/person-module.ts` (new), `components/PersonPicker.tsx` | the `CONDOMINIUMS_MODULE` constant; the picker sends `module=condominiums`, shows the ID in each option, takes numbers from one digit, and its placeholder mentions the ID |
| `app/(dashboard)/persons/_components/PersonsTable.tsx`, `PersonRow.tsx`, `PersonsFilters.tsx`; `persons/[id]/page.tsx` | ID column, `module=condominiums`, search placeholder, read-only ID in the header |
| `app/(dashboard)/condominiums/_components/CondominiumsTable.tsx`, `CondominiumRow.tsx`, `CondominiumsFilters.tsx`; `condominiums/[id]/page.tsx` | ID column, search placeholder, read-only ID in the header |
| `app/(dashboard)/condominiums/[id]/units/_components/UnitRow.tsx`, `unit-people/UnitPeopleList.tsx` | the person's ID next to each owner and tenant (the unit itself shows no ID) |
| `docs/entities/domain-model.md`, `docs/structure/component-patterns.md` | the ID column pattern and the `module` rule for pickers |

Docs: `docs/apps/persons.md`, `condominiums.md`, `core.md`, `docs/architecture/data.md` (formats: `code`; the modules of a person), `docs/architecture/api.md` (search by number, `module`), `docs/roadmap/phase-8-rentals/README.md` (people and IDs follow this spec; already noted at creation), `docs/features/history.md` on close.

## O — Operations
1. The `core` helper and its tests (consecutive numbers; `validate_unique` does not draw a number).
2. `persons`: `PersonError`, `Module`, `code`, `modules`, constraints and `clean()`; the migration; serializer, filter, view and Admin; tests.
3. `condominiums`: `code` on `Condominium`; the migration; the `UnitPerson` rule and error; serializers, views and Admin; tests.
4. `QuerySearchFilter` and the list-search tests of the three apps.
5. The global search (`term`, ranks, the three searches, `module`, `code` in the items) and its tests.
6. Migration tests with `MigrationExecutor` (creation order, the sequence continues, existing people, reverse).
7. `pytest apps -q`, `mypy apps config`, `manage.py check`, `makemigrations --check --dry-run`, `python backend/docs/tools/check_docs.py`.
8. With the backend running: `cd frontend && npm run generate:api`, restart the dev server, apply the frontend changes of **S**; then `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `npm test`.
9. Manual pass in the browser: the people and condominium lists show the ID and find a record by its number; the header search finds by number from one digit; a person set to `["rentals"]` through the API leaves the persons list and the pickers and cannot be linked to a unit; the same person set back to both modules reappears with the same ID.
10. Docs, spec to `done` and condensed into `features/history.md`.

## N — Norms
`conventions/practices.md` §2 (a rule in the model plus a constraint, an error enum, `clean()` for the single rule of `Person`), §3 (read-only serializer fields), §7 (migrations: the data step has a reverse and is safe to re-run); `architecture/api.md` (additive changes are compatible; search and filters); `conventions/naming.md` (English, no abbreviations: `code`, `modules`). The Portuguese error texts go to `frontend/lib/error-messages.ts` (the compile fails until they exist).

## S — Safeguards
- **Numbering:** a sequence is never reset: deleting records, `seed_demo --clear` or a rollback do not bring a number back, so the demo data shows higher numbers after several seeds. Holes appear only for rolled-back inserts.
- **Enumeration and privacy:** `code` is neither personal data nor a secret; company scoping still decides what a user reaches (another company's number finds nothing, in lists and in the search). Sequential numbers reveal roughly how many records exist across companies; accepted.
- **Search:** the exact-match ordering applies only to a digits-only term; a term of 19 digits or more is never turned into a number (no `bigint` overflow, no 500). A CPF typed without punctuation (11 digits) may equal an existing code: the exact match comes first and the document match follows, so nothing is lost.
- **Modules and integrity:** `modules` cannot be empty or hold an unknown value (model and database). The `UnitPerson` rule has no database twin (a CHECK cannot read another table); every writer goes through `full_clean()` (serializers, services, Admin), as the other cross-table rules do.
- **Leaving `condominiums`:** a person who leaves it keeps the links they have and is not offered for new ones; they vanish from the condominium lists but stay reachable from the unit's page.
- **Compatibility:** every API change is additive (a read-only `code`, an optional `modules`, an optional `module` parameter, three new error codes); old clients keep working; the generated client must be regenerated. `modules` has a database default (`["condominiums"]`) and `code` the sequence default, so an old container (or plain SQL) that does not know the fields keeps inserting people, condominiums and units while a deploy is under way.
- **Migrations on existing data:** the backfill only fills rows whose `code` is empty, so a re-run is harmless; if PostgreSQL reports pending trigger events when the data step shares a migration with schema changes, the backfill moves to its own migration. `makemigrations --check` must stay clean (the final state equals the model).
- **Concurrency:** two simultaneous inserts get different numbers by construction.

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/persons/tests/test_person_code.py::test_new_people_get_consecutive_codes`, `::test_a_deleted_codes_number_is_not_reused`, `::test_full_clean_does_not_draw_a_code`; `apps/condominiums/tests/test_codes.py::test_new_condominiums_get_consecutive_codes`, `::test_a_deleted_codes_number_is_not_reused`, `::test_full_clean_does_not_draw_a_code`; `apps/core/tests/infrastructure/test_sequential_code.py::test_helper_builds_the_database_sequence_field`, `::test_each_model_uses_its_own_sequence`, `::test_the_sequences_exist_in_the_database` |
| R2 | `apps/persons/tests/test_person_code.py::test_code_is_ignored_when_sent_to_the_api`; `apps/condominiums/tests/test_codes.py::test_code_is_ignored_when_sent_to_the_api`, `::test_admin_lists_and_searches_by_the_code_read_only` |
| R3 | `apps/core/tests/infrastructure/test_code_migrations.py::test_existing_people_are_numbered_by_creation_order`, `::test_existing_condominiums_are_numbered_by_creation_order`, `::test_units_get_no_code`, `::test_the_sequence_continues_after_the_highest_code`, `::test_existing_people_become_condominiums`, `::test_the_migrations_reverse` |
| R4 | `apps/persons/tests/test_person_code.py::test_person_responses_carry_the_code`; `apps/condominiums/tests/test_codes.py::test_condominium_and_the_person_of_a_unit_link_carry_the_code`, `::test_a_unit_has_no_id`; `apps/core/tests/search/test_search_by_code.py::test_people_and_condominiums_carry_the_code`, `::test_a_unit_is_found_by_its_number_and_has_no_code` |
| R5 | `apps/persons/tests/test_person_code.py::test_list_search_puts_the_code_match_first`, `::test_list_search_by_code_still_needs_every_term_to_match`, `::test_list_search_with_text_or_long_digits_never_fails`, `::test_list_search_by_code_does_not_cross_companies`; `apps/condominiums/tests/test_codes.py::test_list_search_by_code_for_condominiums`, `::test_units_are_still_searched_by_their_number`, `::test_list_search_by_code_does_not_cross_companies`, `::test_list_search_with_text_or_long_digits_never_fails`; `apps/core/tests/infrastructure/test_query_search_filter.py::test_only_a_short_ascii_digit_term_is_an_id`, `::test_the_views_own_ordering_is_kept_after_the_exact_match`, `::test_a_term_that_is_not_an_id_orders_as_before` |
| R6 | `apps/core/tests/search/test_search_by_code.py::test_digits_only_term_puts_the_code_match_first` (2 and 4 digits), `::test_one_digit_term_returns_only_the_code_match`, `::test_a_document_start_comes_after_the_exact_match`, `::test_term_with_punctuation_is_unchanged`, `::test_long_digit_terms_do_not_overflow`, `::test_term_classification`, `::test_search_by_code_does_not_cross_companies` |
| R7 | `apps/persons/tests/test_person_modules.py::test_default_modules`, `::test_default_modules_through_the_api`, `::test_the_database_defaults_modules_for_writers_that_do_not_know_the_field`, `::test_empty_modules_fail_the_rule`, `::test_database_refuses_empty_and_unknown_modules`, `::test_api_writes_and_reads_modules`, `::test_api_refuses_empty_and_unknown_modules`, `::test_a_patch_cannot_empty_the_modules` |
| R8 | `apps/persons/tests/test_person_modules.py::test_module_filter_lists_only_that_module`, `::test_unknown_module_filter_is_a_400`; `apps/core/tests/search/test_search_by_code.py::test_search_filters_people_by_module`, `::test_search_with_an_unknown_module_is_a_400` |
| R9 | `apps/condominiums/tests/test_unit_person.py::TestPersonModuleRule::test_a_rentals_only_person_cannot_be_linked`, `::test_the_api_answers_400_with_the_module_code`, `::test_a_person_in_both_modules_can_be_linked`, `::test_changing_a_link_to_a_rentals_only_person_is_refused`, `::test_a_person_who_leaves_condominiums_keeps_the_links` |
| R10 | `apps/persons/tests/test_person_modules.py::test_releasing_to_rentals_keeps_the_code` |
| R11 | `frontend/tests/search-index.test.mjs` (a digits-only term is searchable from one digit); the screens have no UI test runner (gap): verified by `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `npm test` and the manual pass of step 9 |
| R12 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [ ] Every criterion R1… has a passing test in the Test plan (R11 and R12 are the written gaps, verified by the gates and review)
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`npm run generate:api`)
- [ ] `docs/apps/persons.md`, `condominiums.md`, `core.md`, `architecture/data.md`, `architecture/api.md`, the frontend docs and the phase 8 notes updated
- [x] `docs/known-gaps.md` row closed — `N/A — this spec closes no gap row`
- [x] Roadmap part and phase table updated — `N/A — Roadmap is none`
- [ ] Index in `features/README.md` updated
