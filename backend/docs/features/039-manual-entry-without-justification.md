---
summary: Spec 039 — a manual ledger entry no longer needs a justification or a unit: the form drops both fields, and a reversal keeps its required reason.
read-when: you touch the manual entry form, the justification rule of the ledger or the reason of a reversal
skip-if: the ledger, the statement and the posting services → apps/finance.md; the batches and the entries endpoints → architecture/api.md
---
# 039 — Manual entries without justification and unit

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** finance, frontend · **Frontend impact:** none

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | The manual entry form no longer asks for the Justificativa nor the Unidade | the user |
| 2026-10-22 | A reversal (estorno) keeps its required reason: the rule and the database constraint that required a justification of every manual entry now apply to a reversal only | agent (to review) |
| 2026-10-22 | The API still accepts `justification` and `unit` when they are sent; entries already saved keep theirs; no data changes | agent (to review) |
| 2026-10-22 | The error code `current_account_entry.justification.blank` stays, now for a reversal without a reason | agent |

## R — Requirements
Staff post a manual entry without explaining it or tying it to a unit; the entry is for the whole condominium. Only a reversal still carries its reason, since it cancels another entry.
- [ ] R1 — A manual entry is saved without a justification: the model, the database and the API accept it
- [ ] R2 — A reversal without a reason is still refused, by the model rule and by the database constraint, with the same coded error
- [ ] R3 — The manual entry form has no Justificativa and no Unidade, and sends neither
- [ ] R4 — Entries already saved keep their justification and unit

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `CurrentAccountEntry` | constraint swapped | `current_account_entry_manual_has_justification` (a manual entry has a non-empty justification) is replaced by `current_account_entry_reversal_has_justification` (an entry with `reversal_of` has one); no column changes |

## A — Approach
The justification explains why an entry exists to the person who audits it. A plain manual entry already has its `description`, its batch and its author; a reversal is the case where the reason matters, because it cancels something. So the rule moves from "manual" to "reversal" instead of disappearing.

Rejected: dropping the `justification` column (it would lose the reasons already stored, and the reversal needs it); keeping the field optional on the form (the user asked to remove it).

## S — Structure
- Backend: `apps/finance/models/current_account_entry.py` (the constraint and the comment), `apps/finance/models/rules/current_account_entry.py` (`reversal_lacks_justification` replaces `manual_entry_lacks_justification`), `apps/finance/migrations/0013_reversal_justification_constraint.py`.
- Frontend: `app/(dashboard)/finance/_components/entries-form/EntryLineFields.tsx` and `lib/schemas/entry-batch.ts` lose the two fields (the generated client does not change: both stay optional in the API).
- Docs: `apps/finance.md`, `entities/domain-model.md` (frontend).

## O — Operations
1. The rule and the constraint, with the migration.
2. The tests of the model, the database and the API.
3. The form and its schema.
4. The docs; close the spec into `features/history.md`.

## N — Norms
N/A.

## S — Safeguards
- Integrity: the new constraint is the same as the old one for reversals and weaker for the other manual entries. Adding it checks the existing rows: every reversal is a manual entry, so it already had a justification, and the migration cannot fail on existing data.
- Traceability: a manual entry without a reason is less self-explanatory; its `description`, `created_by`, batch and `registry` stay, and a mistake is still fixed by a reversal with its reason.
- Compatibility: the API contract does not change (`justification` and `unit` were already optional fields); a client that still sends them keeps working.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_current_account_entry.py::test_a_manual_entry_needs_no_justification`, `apps/finance/tests/test_ledger_api.py::test_a_manual_entry_is_accepted_without_justification_and_without_unit`, `::test_the_database_accepts_a_manual_entry_without_justification` |
| R2 | `apps/finance/tests/test_current_account_entry.py::test_a_reversal_needs_its_justification`, `apps/finance/tests/test_ledger_api.py::test_the_database_refuses_a_reversal_without_justification`, `apps/finance/tests/test_entry_reversal.py::test_the_reason_is_required` |
| R3 | none automated (the form was driven in a browser): a gap written down |
| R4 | none automated (no data is touched; the migration only swaps a constraint, applied to a database with entries): a gap written down |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes; client regenerated: `N/A — no API change`
- [ ] `tsc`, `eslint --max-warnings=0`, `pnpm test` and `pnpm build` clean
- [ ] `docs/apps/finance.md` and the frontend `entities/domain-model.md` updated; the spec index updated
