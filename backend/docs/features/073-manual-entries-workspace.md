---
summary: Spec 073 — the manual entry screen opens from a typed date and batch number (one date per batch, a unique number), its lines drop the date and the competence, take typed or chosen condominium, template and sub-conta (0 by default), and a manual entry can be edited or deleted.
read-when: you change the manual entry (Lançamento manual) screens, the entry batches, or how a manual ledger entry is edited or deleted
skip-if: the ledger and its rules → apps/finance.md; the catalog of entry templates → features/074-entry-template-catalog.md; reversing an automatic entry → apps/finance.md
---
# 073 — Manual entries workspace

**Status:** draft · **Level:** full · **Roadmap:** none · **Apps:** finance, frontend · **Frontend impact:** client regeneration, changed screens

## Open questions
None. The agent's decisions below are to be confirmed by the user when this spec is approved.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-11-26 | Before the entry part opens, the left column asks for a typed **date** (in place of the condominium select) and, below it, the typed **batch number**; with both, the entry screen opens | the user |
| 2026-11-26 | A batch has **one date** and its **number is unique**: a number cannot repeat and a batch cannot have several days | the user |
| 2026-11-26 | The number of the batch is new in **every** batch (bank, cash and extra cash), unique in the company; the origin stays (Banco by default) and the *número do caixa* stays only for the cash origins; the batches that exist get numbers in order | the user |
| 2026-11-26 | Condominium, template and sub-conta are typed (their number) or chosen, and the field shows the whole name. There is no automatic sub-conta: it starts as **0 - Normal** and changes by typing another number | the user |
| 2026-11-26 | The description is **optional**: the template already says what the entry is | the user |
| 2026-11-26 | No competence on a line: the date defines it | the user |
| 2026-11-26 | A batch takes entries of **several condominiums, as many times as wanted**: no limit of one entry per batch | the user |
| 2026-11-26 | An entry can be **edited** or **deleted**. Only the **manual** ones (those made on this screen); the automatic ones (a paid account payable, a paid boleto) keep only the reversal | the user |
| 2026-11-26 | **Deleting** marks the entry as deleted: it leaves the screens, the reports and the balance, but the row stays, with its registry number, who deleted it and when | the user |
| 2026-11-26 | The templates become one **catalog of the administradora** with a unique number (spec 074). This spec does not wait for it: until it lands the template is chosen by name from the condominium's templates, whatever their sub-conta | the user (the catalog); agent, to be confirmed (the order) |
| 2026-11-26 | The date of a manual entry is its **batch's date** and its competence is the first day of that month; the server sets both (the form does not send them) | agent, to be confirmed |
| 2026-11-26 | A blank description stores the **name of the template**, so every statement and report still shows a text | agent, to be confirmed |
| 2026-11-26 | If the condominium has no sub-conta numbered 0, the sub-conta field starts empty and asks for a number; nothing is created silently | agent, to be confirmed |
| 2026-11-26 | The batch is **created with its first entries**, as today (no empty batch is left by a number that was only typed); a typed number that exists opens that batch, and with another date than the typed one it says "O lote N é do dia …" | agent, to be confirmed |
| 2026-11-26 | The list of batches stays under the two fields, narrowed by the typed date (and by the origin filter); the condominium scope leaves the screen (the API filter stays) | agent, to be confirmed |
| 2026-11-26 | Editing changes the **kind, amount, template, sub-conta and description**; not the condominium, the batch or the date (to move an entry: delete it and post it again) | agent, to be confirmed |
| 2026-11-26 | An entry that has a reversal, that is a reversal, or is already deleted cannot be edited or deleted (the reversal pair would stop matching) | agent, to be confirmed |

## R — Requirements
The staff post entries in batches the way the administradora already works: a day, a batch number, and then as many entries as the batch holds, of any condominium, which they can still correct.
- [ ] R1 — The left column of *Lançamento manual* has a **date** field and, below it, a **batch number** field instead of the condominium select; the list of batches follows the typed date; the entry screen opens only with both
- [ ] R2 — `EntryBatch.number`: required, a positive integer, **unique in the company**, never changes; the existing batches get 1, 2, 3… per company by date and creation; `GET /api/entry-batches/?number=`; a repeated number is a coded 400
- [ ] R3 — A batch's `batch_date` never changes; typing the number of a batch that has another date does not open a form for the typed date and says which day the batch belongs to; a manual entry's `entry_date` is its batch's date (rule in the model)
- [ ] R4 — A number that does not exist opens the entry form for a new batch with that date and number (origin Banco by default, the *número do caixa* only for the cash origins); the batch is created together with its first entries
- [ ] R5 — A line of the form has condominium, template, sub-conta, kind, amount and description only. The server sets `entry_date` (the batch's) and `competence_month` (the first day of its month) for a manual entry; a blank description becomes the template's name
- [ ] R6 — Condominium, template and sub-conta accept the number typed or the name chosen, with the **full name visible**; the sub-conta starts as the condominium's sub-conta **0** (empty when there is none) and does **not** follow the template
- [ ] R7 — A batch takes entries at any time, of any condominiums and in any quantity: the batch page has **Adicionar lançamentos** (the existing `POST /api/entry-batches/{id}/entries/`)
- [ ] R8 — A manual entry can be **edited** (`PATCH /api/current-account-entries/{id}/`: kind, amount, template, sub-conta, description); the account's balance moves by the difference in the same transaction
- [ ] R9 — A manual entry can be **deleted** (`DELETE /api/current-account-entries/{id}/`): it is marked as deleted, leaves the balance, the statement and the reports, and keeps its registry number
- [ ] R10 — Only a manual entry that is not deleted, has no reversal and is not a reversal can be edited or deleted; anything else is a coded 400 and the reversal is the way
- [ ] R11 — Every edit and every deletion is in the audit log with the actor: `CurrentAccountEntry` leaves `AUDIT_EXEMPT` and is audited
- [ ] R12 — The batch page lists the entries with **Editar**, **Apagar** (confirmed) and **Estornar** (as today), and says what it is when a button is missing (an automatic entry, a reversed one)

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.EntryBatch` | `number` | `PositiveIntegerField`, required, validator ≥ 1; `UniqueConstraint(company, number)` (`entry_batch_unique_number_per_company`, coded message); rule `EntryBatchRules`: `number` and `batch_date` cannot change once saved |
| `finance.CurrentAccountEntry` | soft delete | `SoftDeleteMixin` (`deleted_at`): `objects` hides the deleted ones, `all_objects` shows them; `delete()` stays refused (a deletion goes through `delete_entry`); `save()` of a saved entry stays refused except through `update_entry` |
| `finance.CurrentAccountEntryRules` | rules | a manual entry's `entry_date` equals its batch's `batch_date`; new `EntryChangeRules`: only `origin=manual`, no `reversal_of`, no `reversal`, not deleted (coded errors) |
| `core.audit` | exemption removed | `finance.CurrentAccountEntry` is registered in `finance/audit.py` and leaves `AUDIT_EXEMPT` |

## A — Approach
- **The number is the key of a batch** and the date is a property that cannot change: the screen looks the number up (`?number=`), compares dates and either opens the batch or the form for a new one. No endpoint is needed for "open or create".
- **Rules in the models**; the services only orchestrate the transaction and the balance. `update_entry(entry, changes, user)` locks the account row (as `post_entry` does), runs the rules and `full_clean()`, saves, and adds the signed difference to `CurrentAccount.balance`; `delete_entry(entry, user)` marks the entry as deleted and subtracts its signed amount. Both leave `CurrentAccount.recalculated_balance()` equal to the cached balance.
- **Deleted, not erased**, like the registries (spec 062): the row keeps its links, its registry number is never reused, and nobody has to explain a gap in the sequence. Every default query (statement, reports, balances, dashboard) already reads `objects`, so they ignore deleted entries without change; the few that use a raw table or `all_objects` are listed in the Test plan.
- **The sub-conta is independent of the template**: the ledger already allows any template of the condominium with any sub-conta of the condominium (`CurrentAccountEntryRules` checks the condominium of each, not that they match). Only the screen tied them; it stops doing so.
- **Server fills what the form does not send**: date, competence and the text of an empty description; automatic postings (payment of a payable, boleto) keep sending their own values.
- Rejected: erasing the row (the registry sequence would have holes and the audit would be the only trace); editing the automatic entries (they are tied to a payable or a boleto); creating the batch as soon as the number is typed (abandoned forms would leave empty batches).

## S — Structure
Backend (`apps/finance/`):
- `models/entry_batch.py`, `models/rules/entry_batch.py`: `number`, the immutability rule; `errors/entry_batch.py` new codes
- `models/current_account_entry.py`, `models/rules/current_account_entry.py` (+ `models/rules/entry_change.py`), `models/querysets/`: soft delete, rules; `errors/current_account_entry.py` new codes
- `services/update_entry.py`, `services/delete_entry.py`: new; `services/post_entry.py` unchanged
- `serializers/current_account_entry_serializers.py`: `BatchEntryLineSerializer` without `entry_date`/`competence_month`, optional `description`; an update serializer for the editable fields
- `views/current_account_entry_views.py`: `PATCH` and `DELETE` (the docstring "never changed or deleted" is rewritten); `views/entry_batch_views.py`, `filters.py`: `?number=`
- `audit.py`: register the entry; `core/infrastructure/audit.py`: drop the exemption
- `migrations/`: `number` (schema, numbering by data migration, constraint) and `deleted_at`

Frontend (`app/(dashboard)/finance/entries/`, `lib/finance/entry-batch-workspace.ts`, `lib/schemas/entry-batch.ts`): the list column with the date and the number, the opening logic (pure, tested), the new form lines, the batch page with *Adicionar lançamentos*, the edit dialog and the delete confirmation; the client is regenerated.

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/entry-batches/` | `?number=`, `?batch_date=`, `?origin=`, `?condominium=` | page of batches | `number` in each row |
| POST | `/api/entry-batches/` | `batch_date`, `number`, `origin`, `cash_number?` | the batch | repeated `number` → 400 |
| POST | `/api/entry-batches/{id}/entries/` | `lines: [{current_account, entry_template, cost_center, kind, amount, description?}]` | the entries | all or none; date and competence from the batch |
| PATCH | `/api/current-account-entries/{id}/` | any of `kind, amount, entry_template, cost_center, description` | the entry | manual only; balance adjusted |
| DELETE | `/api/current-account-entries/{id}/` | — | 204 | marks as deleted; manual only |

## O — Operations
1. `EntryBatch.number`: schema migration (nullable), data migration numbering each company's batches by `(batch_date, created_at)`, constraint migration (required, unique per company).
2. `CurrentAccountEntry.deleted_at` and the managers; the audit registration and the exemption removal.
3. The rules (`EntryBatchRules`, the date rule, `EntryChangeRules`) and the coded errors.
4. `update_entry` and `delete_entry`; the PATCH and DELETE actions; the batch entries serializer without date and competence.
5. Filter `?number=`; tests; docs (`apps/finance.md`, `architecture/api.md` if the contract rules change); regenerate the client.
6. Frontend: the column, the opening logic, the form lines, the batch page, edit and delete; tests; docs.

## N — Norms
Rules in the models, services orchestrate (`conventions/practices.md` §2, §3b); names in English; user text in Portuguese; filters and search on the server (`?query=` for the condominium and sub-conta fields, never a client filter); one concern per PR (backend, then frontend).

## S — Safeguards
- **Company scoping:** the new endpoints use the existing company-scoped viewset; another company's entry or batch is a 404; the number is unique per company, not global.
- **Integrity:** one transaction per change, the account row locked, the balance moved by the exact difference; `recalculated_balance()` still equals the cached balance after any sequence of post, edit, delete and reverse (a test). Two users typing the same new number: the second gets the unique-constraint error as a coded 400.
- **Closed months:** closings do not exist yet (phase 6). When they do, editing and deleting an entry of a closed month must be refused; recorded in `known-gaps.md`.
- **Audit:** who changed or deleted what, and when, is in the audit log; the deleted row stays in the table.
- **Compatibility:** `number` is required to create a batch (only our screen calls it); `entry_date` and `competence_month` become optional on the batch entries endpoint and are ignored for a manual entry; the automatic postings do not change.
- **Performance:** index on `(company, number)` through the constraint; the opening check is one `?number=` query.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `frontend/tests/entry-batch-workspace.test.mjs` (the opening decision from a typed date and number); the column was driven in a browser |
| R2 | `apps/finance/tests/test_entry_batch_number.py` (unique per company, never changes, the migration numbers in order, `?number=`) |
| R3 | `apps/finance/tests/test_entry_batch_number.py::test_the_date_of_a_batch_never_changes` and `test_current_account_entry.py::test_a_manual_entry_takes_the_date_of_its_batch`; the message of another day: frontend test |
| R4 | `frontend/tests/entry-batch-workspace.test.mjs`; the form was driven in a browser |
| R5 | `apps/finance/tests/test_batch_entries_api.py::test_the_server_sets_the_date_the_competence_and_the_description` |
| R6 | `frontend/tests/entry-batch-workspace.test.mjs` (default sub-conta 0, empty without it); typing and full names driven in a browser |
| R7 | `apps/finance/tests/test_batch_entries_api.py::test_a_batch_takes_more_entries_later_from_other_condominiums`; the page driven in a browser |
| R8 | `apps/finance/tests/test_update_entry.py` (balance difference, fields, company scoping) |
| R9 | `apps/finance/tests/test_delete_entry.py` (leaves balance, statement and reports; the registry number stays; `recalculated_balance` matches) |
| R10 | `apps/finance/tests/test_update_entry.py::test_automatic_reversed_and_deleted_entries_are_refused` |
| R11 | `apps/finance/tests/test_update_entry.py::test_the_change_and_the_deletion_are_audited`; `apps/core/tests/infrastructure/test_audit_trail.py` |
| R12 | none automated: the batch page driven in a browser (a written gap) |

Layers: model/constraint, rules, services (balance), API (permissions, company scoping, errors), migrations (numbering), frontend pure helpers.

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean; `mypy apps config` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`); `tsc`, `eslint`, `pnpm test`, `pnpm build` clean
- [ ] `docs/apps/finance.md` updated (the entry is no longer immutable: the rules above); `known-gaps.md`: the closed-month note
- [ ] The screens were driven in a browser (the column, the form, the batch page, edit and delete); what was not checked is written down
