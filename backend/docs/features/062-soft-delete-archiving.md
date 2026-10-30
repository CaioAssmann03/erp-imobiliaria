---
summary: Spec 062 — deleting a condominium, block, unit, person, supplier or sub-conta archives it (soft delete): it leaves every query and screen but stays in the database; persons can be anonymized for the LGPD.
read-when: you change what "delete" does to a registry record, add a model that must keep its history, or touch the person anonymization or the archived-record rules
skip-if: the audit trail of changes → architecture/quality.md; the ledger and its reversals → apps/finance.md; how a code or a document is made unique → architecture/data.md
---
# 062 — Soft delete (archiving) of registry records

**Status:** done · **Level:** full · **Roadmap:** none · **Apps:** core, persons, condominiums, finance · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | Deleting a registry record becomes **archiving** (soft delete): the row stays in the database, with its links and history, and leaves every query, list, search and report | user |
| 2026-10-30 | In scope: condominium, block, unit, person, supplier and sub-conta (`CostCenter`) | user |
| 2026-10-30 | The ledger (current account and entries) is not touched: it already never changes and is never deleted | user |
| 2026-10-30 | The cascade stays manual and ordered: a condominium is archived only after its units and blocks are archived; an active condominium cannot be archived | user |
| 2026-10-30 | The frontend keeps the word **Excluir** (UI/UX only); the API keeps `DELETE` | user |
| 2026-10-30 | Persons are archived, never hard-deleted; the LGPD erasure request is an **anonymization**, a separate irreversible action after the retention period | user (suggested by the agent) |
| 2026-10-30 | An archived record is still reachable from the records that point at it (a unit keeps its archived condominium, a ledger entry its archived sub-conta), so history never breaks | agent, to be confirmed |
| 2026-10-30 | A condominium also has to be **inactive** to be archived | user |
| 2026-10-30 | Q1 — a person may be anonymized only after 5 years from their last financial link or ledger entry (one named constant; the period is to be confirmed with whoever is in charge of the LGPD) | user (accepted the recommendation) |
| 2026-10-30 | Q2 — archive = whoever may delete today; restore = Admin only; anonymize = superuser only | user (accepted the recommendation) |
| 2026-10-30 | Q3 — no restore screen in the frontend in this spec: restore through the Admin and through the "document belongs to an archived record" prompt | user (accepted the recommendation) |
| 2026-10-30 | Q4 — the CNPJ of a condominium and the CPF/CNPJ of a person stay unique including archived records; unit name, block name, sub-conta code and name are unique only among non-archived records | user (accepted the recommendation) |
| 2026-10-30 | Q5 — archive guards: condominium = inactive, no non-archived unit, block or sub-conta, no open account payable, no open boleto; unit = no current owner/tenant link and no open boleto; person = no current link to a non-archived unit and not an active supplier; supplier = no open account payable; sub-conta = no entry templates and not used by an active billing plan item | user (accepted the recommendation) |
| 2026-10-30 | Q6 — the statement and the reports of an archived condominium are readable only in the Admin, read-only | user (accepted the recommendation) |
| 2026-10-30 | R5 became smaller: the CPF/CNPJ of a deleted person stays taken through the existing `*.duplicate_in_company` error (its message now says the person may have been deleted); the error does not carry the deleted person's id, because it is raised while the nested document is validated, before the person exists. Restoring is superuser-only (Q2), so a "restore" prompt for the staff would have nothing to call | agent, to be confirmed |
| 2026-10-30 | A person who is the advisor of a live condominium cannot be deleted (an extra guard of `PersonArchiveRules`) | agent, to be confirmed |
| 2026-10-30 | A condominium's open boletos are not a guard of the condominium itself: its units must be deleted first, and a unit with a boleto awaiting payment cannot be | agent, to be confirmed |
| 2026-10-30 | The database holds only fake data: it may be wiped and reseeded, so the migration needs no backfill and no backup | user |

## R — Requirements
Problem: a financial ERP loses history when a cadastral record is deleted for good (the audit log keeps who and when, but personal fields are masked, so nothing can be restored), and the foreign keys already block the deletion of what was used, answering a 500 (known gap 27). Outcome: "delete" keeps the data, the screens stop showing it, the rules that protected the history become explicit refusals with a code.
- [x] R1 — `DELETE` on a condominium, block, unit, person, supplier or sub-conta sets `deleted_at` (204) and never removes the row; deleting twice is a 404
- [x] R2 — an archived record is absent from every list, detail, search, filter option, dashboard count, report and billing emission (404 on its detail); records that point at it still resolve it
- [x] R3 — archiving is refused with a coded 400 (not a 500) when the guards of Q5 fail; an active condominium, or one with non-archived units or blocks, is refused
- [x] R4 — the uniqueness of Q4 holds: the document stays unique including archived records; unit name, block name, sub-conta code and name are unique among non-archived records only
- [x] R5 — registering a person (or condominium, or a supplier for a person) whose document or record belongs to an archived one is refused with a coded 400 (`*.duplicate_in_company`, `condominium.cnpj.archived`, `supplier.person.has_archived_supplier`)
- [x] R6 — `POST /persons/{id}/restore/` brings an archived person back (Admin, Q2); the same for the other archived models through the Admin
- [x] R7 — `POST /persons/{id}/anonymize/` replaces the personal and bank data of an archived person with neutral values, keeps the id and every link, is refused before the retention period (Q1) and is irreversible
- [x] R8 — archiving, restoring and anonymizing are written to the audit trail with the actor, personal values masked
- [x] R9 — archiving a condominium leaves its current account and entries untouched and readable in the Admin
- [x] R10 — the Admin lists archived records (with a filter) and has the restore action

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `SoftDeleteModel` (abstract, `apps/core/models/soft_delete.py`) | new | `deleted_at` `DateTimeField(null=True, blank=True, editable=False, db_index=True)`; manager `objects` hides archived, `all_objects` shows all; `delete()` archives (runs the model's archive rules first); `restore()`; `is_archived` property |
| `Condominium`, `Block`, `Unit`, `Person`, `Supplier`, `CostCenter` | inherit `SoftDeleteModel` | migration adds the nullable column, no data change; `Meta.base_manager_name` stays the plain manager so a foreign key to an archived row still resolves |
| Unique constraints | replaced | `unit_unique_per_block`, `unit_unique_per_condominium`, `block_unique_name_per_condominium`, `cost_center_unique_code_per_condominium`, `cost_center_unique_name_per_condominium` gain `condition=Q(deleted_at__isnull=True)`; the person and condominium document constraints stay as they are (Q4) |
| Archive rules | new | `models/rules/<entity>_archive.py` per model (Q5), raised from `delete()` as coded validation errors (`CostCenter.delete()` is the model for it) |
| `Person` | new methods | `anonymize()` (a service orchestrates `Person`, `PeopleIndividual`/`PeopleLegal` and `Supplier` bank data), `RETENTION_YEARS` constant (Q1) |
| Error codes | new | `<entity>.archive.*` for each guard, `person.document.archived` (carries the id) |

## A — Approach
One abstract model and a manager in `core`, inherited by the six models, instead of a library: `django-safedelete` cascades by itself and the user wants the cascade manual and ordered; reusing `active` was rejected because "inactive" (a status the staff toggles and that still shows in lists) and "archived" (gone from every query) mean different things. `delete()` is the only entry point (the viewsets already call it), so the guards stay in the models. Related access: Django resolves a forward foreign key with the base manager (so a unit still reaches its archived condominium) and a reverse relation with the default manager (so `condominium.units` hides archived units). `QuerySet.delete()` is overridden to archive too, so a bulk delete cannot bypass it. Anonymization is a use case over several models, so it is a service (`services/anonymize_person.py`); restore is a plain model method. The audit trail already logs a `save()`, so archive/restore/anonymize appear in it with no new code.

## S — Structure
`apps/core/models/soft_delete.py`; the six models; `apps/<app>/models/rules/*_archive.py`; `apps/persons/services/anonymize_person.py`; `apps/persons/views/person_views.py` (`restore`, `anonymize` actions); serializers (document-archived error); `apps/<app>/admin.py` (archived filter, restore action); migrations `core`, `persons`, `condominiums`, `finance`.
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| DELETE | `/api/{condominiums,blocks,units,persons,suppliers,cost-centers}/{id}/` | — | 204 / 400 coded | archives |
| POST | `/api/persons/{id}/restore/` | — | 200 person | Q2 |
| POST | `/api/persons/{id}/anonymize/` | — | 200 person | Q1, Q2; irreversible |

## O — Operations
1. `SoftDeleteModel`, manager, queryset `delete()`, tests of the base.
2. Migrations: add `deleted_at`; replace the unique constraints (drop and add with the condition).
3. Archive rules and error codes per model; `delete()` calls them.
4. Review every query that reads these models directly (`Model.objects`) for places that must see archived rows (the Admin, the anonymization, the "document belongs to an archived record" check).
5. `anonymize_person` service, `restore` and `anonymize` actions, serializer error for the archived document.
6. Admin: archived filter and restore action.
7. Docs: `apps/<app>.md`, `architecture/data.md`, `known-gaps.md` (close row 27), `architecture/quality.md` (LGPD section).
8. Tell the user the client must be regenerated; the frontend keeps "Excluir" and shows the coded refusals in the toast.

## N — Norms
Business rules only in models (`conventions/practices.md` §2): the archive guards are model rules; the anonymization orchestrates several models, so it is a service (§3b). Names per `conventions/naming.md` (`is_archived`, `reference_date`, no flag arguments). One entity per file.

## S — Safeguards
- **LGPD:** archiving keeps the data; erasure is the anonymization, which needs the retention period and cannot be undone; the audit trail keeps masking personal values. This spec is not legal advice: Q1 must be confirmed by whoever is in charge of the LGPD.
- **Migration on existing data:** the new column is nullable with no backfill; the replaced unique constraints are created in the same migration as the old ones are dropped, in one transaction, and checked on a copy of the database first. The data is fake today (it can be wiped and reseeded); the database backup (known gap 19) must be running before this is applied to real data.
- **Integrity:** an archive refusal replaces the `PROTECT` that used to stop the deletion, so each guard of Q5 is tested; nothing is cascaded automatically.
- **Performance:** `deleted_at` is indexed; the unique constraints are partial indexes.
- **Failure modes:** a bulk delete or raw SQL that bypasses `delete()` is the same exposure as known gap 30; the queryset override covers the ORM path.
- **Compatibility:** the API contract adds two actions and error codes; the list/detail payloads do not change.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_soft_delete.py::test_delete_archives_and_keeps_the_row`, `apps/condominiums/tests/test_archiving.py::test_a_deleted_unit_leaves_the_list_and_the_detail`, `apps/persons/tests/test_archiving.py::test_a_deleted_person_leaves_the_list_and_the_detail` |
| R2 | `apps/core/tests/test_soft_delete.py::test_archived_leaves_default_queries_but_is_still_reachable`, `apps/core/tests/test_soft_delete.py::test_a_record_still_reaches_what_was_archived` |
| R3 | `apps/condominiums/tests/test_archiving.py::test_an_active_condominium_cannot_be_deleted` (and the units/blocks, block, unit and advisor guards in the same file), `apps/finance/tests/test_archiving.py::test_a_supplier_with_an_open_account_payable_cannot_be_deleted`, `apps/finance/tests/test_archiving.py::test_a_cost_center_with_entry_templates_cannot_be_deleted`, `apps/finance/tests/test_archiving.py::test_an_open_account_payable_blocks_archiving_its_condominium`, `apps/finance/tests/test_archiving.py::test_an_active_supplier_keeps_its_person_from_being_deleted`, `apps/billing/tests/test_archiving.py::test_a_sub_conta_in_an_active_plan_is_not_archivable` |
| R4 | `apps/condominiums/tests/test_archiving.py::test_a_unit_name_can_be_reused_after_the_unit_is_deleted`, `apps/condominiums/tests/test_archiving.py::test_a_block_name_can_be_reused_after_the_block_is_deleted`, `apps/finance/tests/test_archiving.py::test_a_deleted_cost_center_frees_its_name_and_code`, `apps/condominiums/tests/test_archiving.py::test_registering_the_cnpj_of_a_deleted_condominium_is_refused` |
| R5 | `apps/persons/tests/test_archiving.py::test_the_cpf_of_a_deleted_person_stays_taken`, `apps/finance/tests/test_archiving.py::test_a_new_supplier_for_a_person_with_a_deleted_one_is_refused`, `apps/condominiums/tests/test_archiving.py::test_registering_the_cnpj_of_a_deleted_condominium_is_refused` |
| R6 | `apps/persons/tests/test_archiving.py::test_a_superuser_restores_a_deleted_person`, `apps/persons/tests/test_archiving.py::test_a_staff_user_cannot_restore`, `apps/core/tests/test_soft_delete.py::test_restore_brings_the_record_back`, `apps/core/tests/test_soft_delete.py::test_restore_is_refused_when_the_name_was_taken_meanwhile` |
| R7 | `apps/persons/tests/test_archiving.py::test_anonymizing_replaces_the_personal_data_and_keeps_the_record`, `apps/persons/tests/test_archiving.py::test_anonymizing_is_refused_inside_the_retention_period`, `apps/persons/tests/test_archiving.py::test_a_person_cannot_be_anonymized_twice`, `apps/persons/tests/test_archiving.py::test_a_staff_user_cannot_anonymize` |
| R8 | `apps/core/tests/test_soft_delete.py::test_archive_and_restore_are_audited` |
| R9 | `apps/finance/tests/test_archiving.py::test_archiving_a_condominium_keeps_its_ledger` |
| R10 | `apps/core/tests/test_soft_delete_admin.py::test_the_admin_queryset_includes_deleted_records`, `apps/core/tests/test_soft_delete_admin.py::test_the_filter_hides_deleted_records_by_default_and_shows_them_on_request`, `apps/core/tests/test_soft_delete_admin.py::test_the_restore_action_brings_deleted_records_back`, `apps/core/tests/test_soft_delete_admin.py::test_a_refused_deletion_in_the_admin_is_a_message_not_an_error` |

Layers to cover: model/constraint, serializer validation, API (delete, restore, anonymize, lists, errors).

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`; the 18 new error codes have Portuguese messages in `lib/error-messages.ts`)
- [x] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row 27 closed
- [x] Roadmap part and phase table updated: N/A — Roadmap is `none`; index in `features/README.md` updated
