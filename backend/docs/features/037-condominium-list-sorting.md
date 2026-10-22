---
summary: Spec 037 — the condominium list sorts by a click on a column header (ID, name, status): `?ordering=` on the API, sortable headers on the screen.
read-when: you touch the ordering of a list, `?ordering=` or the sortable column headers
skip-if: pagination, search or the other filters of a list → architecture/api.md; the condominium endpoints and rules → apps/condominiums.md
---
# 037 — Sortable condominium list

**Status:** in-progress · **Level:** lite · **Roadmap:** none · **Apps:** condominiums, core · **Frontend impact:** client regeneration

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | A click on a column header sorts the list by it, ascending; a second click on the same column reverses it. The columns are the three with a header: ID, Condomínio (name) and Status | the user |
| 2026-10-22 | The server sorts (`?ordering=`): the list is paginated, so sorting the rows on screen would only reorder one page | agent |
| 2026-10-22 | The list opens sorted by name, ascending (the model's order) and the header shows it; that default is never sent, so the first request equals the server prefetch. A click on the sorted column reverses it, a click on another column starts ascending | agent (to review in the PR) |
| 2026-10-22 | Status ascending puts "Ativo" first (alphabetical order of the labels), descending puts "Inativo" first | agent (to review in the PR) |
| 2026-10-22 | Every ordering is followed by the default order and then the id, so rows with equal values never repeat or skip between pages | agent |
| 2026-10-22 | Only the condominium list for now; the header component and the hook are reusable by the other lists | agent (to review in the PR) |

## R — Requirements
Staff click the ID, Condomínio or Status header of the condominium list to sort it, ascending first and descending on the second click. The API applies the order to all pages.
- [ ] R1 — `GET /api/condominiums/?ordering=` sorts by `code`, `name` or `active`; a `-` prefix reverses it; an unknown value is ignored (the default order applies)
- [ ] R2 — Rows with equal values keep a fixed order (the requested field, the default order, then the id), so consecutive pages never repeat or skip a row
- [ ] R3 — With a search term the exact ID match stays first and the requested order applies to the rest
- [ ] R4 — A click on a header sorts ascending, a second click on it descending, a click on another header starts ascending; the current column and direction are shown (arrow and `aria-sort`) and a new order goes back to page 1
- [ ] R5 — The list opens sorted by name ascending and its first request carries no `ordering`

## E — Entities
No schema change.

## S — Structure
- Backend: `TieBreakingOrderingFilter` in `apps/core/api/filters.py` (DRF `OrderingFilter` that appends the view's default order and the id; its schema parameter lists the allowed values). `CondominiumViewSet`: `ordering_fields = ("code", "name", "active")`, `ordering = ("name",)` and the filter **before** `QuerySearchFilter` in `filter_backends`. Query parameter `ordering` (enum), in the OpenAPI schema.
- Frontend: `lib/list-sort.ts` (pure: next state, API value), `hooks/use-list-sort.ts`, `components/data-list/SortableHead.tsx`; `CondominiumsTable` uses them and `condominium-sort.ts` holds its column table. Client regenerated.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/condominiums/tests/test_api_ordering.py::test_orders_by_each_field_in_both_directions`, `::test_an_unknown_ordering_is_ignored` |
| R2 | `apps/core/tests/search/test_ordering_filter.py::test_every_ordering_ends_with_the_default_order_and_the_id` |
| R3 | `apps/condominiums/tests/test_api_ordering.py::test_the_exact_id_match_stays_first` |
| R4, R5 | `frontend/tests/list-sort.test.mjs` (the state change and the API value); the header itself was driven in a browser |

## Definition of done
- [ ] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes; client regenerated
- [ ] `docs/apps/condominiums.md` and `architecture/api.md` updated; the spec index updated
