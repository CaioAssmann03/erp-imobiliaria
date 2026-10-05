---
summary: Spec: change audit trail for the registries (who changed what and when) with django-auditlog, personal values masked, visible only to superusers; with a Django 6.1 spike and a fallback.
read-when: you touch the audit log, register a model for auditing, handle who-changed-what, or decide how personal data appears in logs
skip-if: finance records' own audit fields (created_by, reversal) → roadmap/phase-3-finance-base/04-current-account-ledger.md; company scoping → features/004-company-scoping.md; personal-data rules in general → architecture/quality.md
---
# 005 — Change audit trail

**Status:** done · **Level:** full · **Roadmap:** phase 3a part 06 · **Apps:** core (helper, admin), accounts, persons, condominiums, finance · **Frontend impact:** none

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | Audit the registries with `django-auditlog`; finance records keep their own explicit audit fields (they are part of the business rule, phase 3) (gap #20) | the user |
| 2026-10-05 | The library is not declared for Django 6 (3.4.1 lists 4.2 to 5.2; the project runs 6.1.1): the spec starts with a **spike**; if it fails, plan B is a small `AuditEntry` model of our own fed by signals | the user |
| 2026-10-05 | Log that a personal field changed, with its value **masked** | the user |
| 2026-10-05 | Only superusers see the log, in the Django Admin (the log has no company of its own) | the user |
| 2026-10-05 | Keep the log indefinitely for now; revisit with the backup policy (gap #19) | the user |
| 2026-10-05 | Each app registers its own models in `apps/<app>/audit.py` (called from `AppConfig.ready()`) through a helper in `apps/core/audit.py`; `core` does not import the other apps (layer direction, `architecture/overview.md`) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Masked fields: `Person` e-mail and the three phones; `PeopleIndividual` cpf, rg, birthday, marital_status, job; `PeopleLegal` cnpj, ie. `Condominium.cnpj` is a legal entity's document, not personal data, and stays visible | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `Company` and `User` are audited too; for `User`, `password` and `last_login` are excluded | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The actor of an API request is set from the JWT authentication class (the library's middleware only sees the session user, which is empty for token requests) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The library's default masking (`mask_str`) keeps the second half of the value visible, which would store half a CPF: `apps.core.audit.mask_personal_value` replaces it and always logs `[masked]` | agent, found in the spike; **not yet confirmed by the user** |
| 2026-10-05 | `AUDITLOG_DISABLE_REMOTE_ADDR = True`: the client address is not stored (the library trusts a forgeable `X-Forwarded-For` and an address is personal data) | agent, found in the spike; **not yet confirmed by the user** |
| 2026-10-05 | The actor is set by `AuditedJWTAuthentication` writing into the library's request context (`auditlog.context.auditlog_value`, an internal of 3.4.1): covered by the actor tests, which will fail if a library upgrade changes it | agent, found in the spike; **not yet confirmed by the user** |
| 2026-10-05 | Writes that bypass `save()` (`QuerySet.update()`, `bulk_create`, raw SQL) are not logged; this is documented as a known limit, not worked around | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
Nobody can tell today who changed a person, a condominium, a unit or a link. The audit trail answers that without becoming a second copy of personal data.
- [x] R1 — Spike: `django-auditlog` installs on Django 6.1.1, its migrations apply on PostgreSQL, and create/update/delete logging works in the CI test run; if not, the decision to use plan B is recorded in Decisions and R2 to R9 are met by the fallback
- [x] R2 — Creating, updating and deleting an audited record writes one log entry with actor, time, action, model, object id, a readable object name and the changed fields (old and new value)
- [x] R3 — The actor is the authenticated user for API (JWT) requests and for Django Admin edits; commands, tasks and the seed log no actor
- [x] R4 — The masked personal fields appear in an entry as changed, with a masked value; the real value is never stored in the log
- [x] R5 — A nested write (a person with its individual or legal data, a condominium with address, contract and billing rules) logs one entry per changed record, and a write rolled back by an error leaves no entry
- [x] R6 — The log is visible only to superusers in the Django Admin and is read-only (no add, change or delete for anyone)
- [x] R7 — `Company` and `User` are audited; the `User` entries never contain `password` or `last_login`
- [x] R8 — A guard test fails when a model of `apps.*` is neither registered for auditing nor on the explicit exempt list
- [x] R9 — The limit (writes that bypass `save()`) and the rules for new models are documented

## E — Entities
No project model changes. The library adds its own `auditlog.LogEntry` table (actor foreign key to `accounts.User`, `object_pk` as text, so UUID primary keys work); its model is outside `apps.*` and therefore outside the scoping guard of spec 004.
| Entity | Registration (`apps/<app>/audit.py`) | Masked | Excluded |
|---|---|---|---|
| `persons.Person` | yes | `email`, `home_phone`, `business_phone`, `cell_number` | - |
| `persons.PeopleIndividual` | yes | `cpf`, `rg`, `birthday`, `marital_status`, `job` | - |
| `persons.PeopleLegal` | yes | `cnpj`, `ie` | - |
| `condominiums.Condominium`, `Address`, `AdministrationContract`, `BillingRules`, `Block`, `Unit`, `UnitPerson` | yes | - | - |
| `finance.CostCenter`, `EntryTemplate` | yes | - | - |
| `core.Company` | yes | - | - |
| `accounts.User` | yes | - | `password`, `last_login` |

Exempt list (not audited, with the reason): the finance records of phase 3 onwards (`AccountPayable`, ledger entries...) carry `created_by`, `created_at` and reversal entries by rule; models of stub apps without records.

## A — Approach
- **Library:** `django-auditlog`, kept after the user's decision because its `mask_fields` lets us log that a personal field changed without copying its value (the history libraries copy whole rows, which would duplicate CPF and phones).
  Alternatives considered: `django-simple-history` and `django-pghistory` (both declare Django 6.0, both store full row copies), a model of our own (plan B).
- **Spike first.** Step 1 installs the library on the project's Django 6.1.1, applies its migrations and runs a minimal logging test in CI. The result is written in the *Result* of the roadmap part. Plan B: an `AuditEntry` model (actor, action, content type, object id, changed fields with the same masking) fed by `post_save`/`post_delete` signals, with the same tests.
- **One helper, one registry per app.** `apps/core/audit.py` exposes `register_audited(model, masked_fields=(), excluded_fields=())`; each app lists its models in `apps/<app>/audit.py` and calls it from `AppConfig.ready()`. No central list, and `core` imports no domain app.
- **Actor.** The library's middleware reads the session user, which is anonymous for DRF token requests. The JWT authentication class (a thin subclass in `accounts`) sets the actor in the library's context after it authenticates; the Django Admin uses the session user through the middleware. Commands and tasks set none (logged as system).
- **Atomicity.** The entry is written in the same transaction as the change (signal on `save()`), so a rollback removes both.
- **Visibility.** The library's admin is re-registered read-only; `has_view_permission` is true only for superusers, `has_add/change/delete_permission` are always false.
- **Rejected:** logging values and relying on the UI to hide them; triggers in PostgreSQL (copies rows, depends on session context that the Supabase pooler may break).

## S — Structure
| File | Change |
|---|---|
| `requirements.txt` | pin `django-auditlog` (version from the spike) |
| `config/settings.py` | `auditlog` in `INSTALLED_APPS`, `AuditlogMiddleware` after `AuthenticationMiddleware`; library settings off by default (no `INCLUDE_ALL_MODELS`) |
| `apps/core/audit.py` | new: `register_audited`, `is_audited(model)` for the guard test |
| `apps/accounts/authentication.py` | new: JWT authentication subclass that sets the audit actor; `REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"]` points to it |
| `apps/<app>/audit.py` and `apps/<app>/apps.py` | per-app registration (`accounts`, `core`, `persons`, `condominiums`, `finance`) |
| `apps/core/admin.py` | read-only, superuser-only `LogEntry` admin |
| `apps/core/tests/test_audit_trail.py`, `apps/accounts/tests/test_audit_actor.py`, `apps/<app>/tests/test_audit_registered.py` | tests |
| `docs/architecture/quality.md`, `apps/core.md`, `apps/accounts.md`, `architecture/overview.md`, `known-gaps.md` | docs |
No endpoints change.

## O — Operations
1. Spike: add the dependency, `auditlog` to `INSTALLED_APPS`, `migrate`, a smoke test that logs a create/update/delete on one model; record the outcome in the roadmap part. Stop and switch to plan B if it fails.
2. `apps/core/audit.py` and its tests; the read-only admin.
3. The JWT authentication subclass and the middleware; the actor tests (API and admin).
4. Per-app `audit.py` and `ready()` registration with the masked and excluded fields.
5. Nested-write and rollback tests; masking tests; the guard test.
6. Docs; delete the audit half of gap #20 (the `ADMIN_URL` half moves to phase 3a part 09).

## N — Norms
`conventions/practices.md` (no business rule in views; the registration is configuration, not a rule), `architecture/quality.md` (LGPD: never log personal values), `conventions/naming.md` (`register_audited`, `masked_fields`). Order of work: after phase 3a parts 02 and 05.

## S — Safeguards
- **LGPD:** masked values only; the exempt list and the masked list are reviewed whenever a model gets a personal field (checklist item in the spec of any new personal field).
- **Integrity of the log:** read-only for everyone in the admin; no endpoint exposes it; deleting an audited record keeps its entries.
- **Superuser access:** superusers read every company's entries; this is intended (support) and is why the log stays out of the staff-facing API.
- **Performance:** one extra insert per audited write; registries are written rarely. The log table is indexed by the library; revisit with the retention decision.
- **Compatibility risk:** the library is not declared for Django 6; the spike and the plan B above contain it, and CI fails if a later Django upgrade breaks the logging tests.
- **Known limit:** `QuerySet.update()`, `bulk_create`/`bulk_update` and raw SQL do not produce entries. App code writes through `save()`; the `seed_demo` and commands log no actor.

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_audit_trail.py::test_auditlog_logs_create_update_delete_on_postgres` (the whole suite, migrations included, runs on Django 6.1.1 with the library enabled: the spike passed) |
| R2 | `apps/core/tests/test_audit_trail.py::test_create_update_delete_write_entries_with_changes` |
| R3 | `apps/accounts/tests/test_audit_actor.py::test_api_write_logs_the_jwt_user`, `::test_admin_edit_logs_the_session_user`, `apps/core/tests/test_audit_trail.py::test_command_write_logs_no_actor` |
| R4 | `apps/persons/tests/test_audit_registered.py::test_personal_fields_are_masked_in_entries`, `::test_real_cpf_never_appears_in_any_entry`, `::test_real_cnpj_never_appears_in_any_entry` |
| R5 | `apps/persons/tests/test_audit_registered.py::test_nested_person_write_logs_each_record`, `apps/core/tests/test_audit_trail.py::test_rolled_back_write_leaves_no_entry` |
| R6 | `apps/core/tests/test_audit_trail.py::test_log_admin_visible_only_to_superuser`, `::test_log_admin_is_read_only` |
| R7 | `apps/accounts/tests/test_audit_actor.py::test_user_entries_exclude_password_and_last_login`, `apps/core/tests/test_audit_trail.py::test_company_is_audited` |
| R8 | `apps/core/tests/test_audit_trail.py::test_every_model_is_audited_or_exempt`, `::test_exempt_models_have_a_reason` |
| R9 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed — `N/A — no API change`
- [x] `docs/architecture/quality.md`, `apps/core.md`, `apps/accounts.md`, `architecture/overview.md` (new dependency and the JWT authentication class) updated; the audit half of gap #20 removed from `docs/known-gaps.md`
- [x] Roadmap part 06 and the phase 3a table updated; index in `features/README.md` updated
