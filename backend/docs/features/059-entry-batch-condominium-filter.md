---
summary: Spec 059 — the entry batch list can be filtered by condominium (the batches that have at least one entry of it).
read-when: you change the filters of the entry batch list or the Lançamento manual list screen
skip-if: the ledger records and the batch rules → apps/finance.md; the accountability pagination → features/058-accountability-pagination.md
---
# 059 — Entry batch filter by condominium

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** finance · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | `GET /api/entry-batches/?condominium=<id>` lists the batches that have at least one entry of that condominium; a batch may cover several, so it is listed for each of them | user |
| 2026-10-30 | The batch is listed once even with several entries of the condominium, and the filter combines with `origin` and `batch_date`; the batch itself and its other entries are unchanged | agent, to be confirmed |

## R — Requirements
The Lançamento manual screen lists batches, and people look for a movement by condominium.
- [x] R1 — `?condominium=<id>` returns only the batches that have an entry of that condominium's current account, each once
- [x] R2 — it combines with `?origin=` and `?batch_date=`; a value that is not an id is a 400

## E — Entities
`No schema change.`

## S — Structure
- `apps/finance/filters.py` — `EntryBatchFilter` (`origin`, `batch_date` and `condominium` through `entries__current_account__condominium`, distinct)
- `apps/finance/views/entry_batch_views.py` — the viewset uses it instead of `filterset_fields`

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_entry_batch_filters.py::test_a_batch_is_listed_for_each_condominium_it_has_an_entry_of` |
| R2 | `apps/finance/tests/test_entry_batch_filters.py::test_the_condominium_filter_combines_with_the_others_and_must_be_an_id` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/finance.md` updated; roadmap part/phase and the spec index updated (if applicable)
