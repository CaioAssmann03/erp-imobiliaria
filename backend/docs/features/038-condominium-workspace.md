---
summary: Spec 038 — the condominium screen becomes one workspace (list on the left, section cards with a pencil in the middle, section menu on the right) with the data that exists today; the list carries `unit_count`.
read-when: you build or change the condominium workspace screen, its list, the section menu or the editing per card
skip-if: the other sections of the workspace (síndico, bank data, settings...) → roadmap/phase-2a-condominium-workspace/README.md; the condominium endpoints and rules → apps/condominiums.md
---
# 038 — Condominium workspace

**Status:** in-progress · **Level:** full · **Roadmap:** phase 2a part 01 · **Apps:** condominiums, frontend · **Frontend impact:** new screens

## Open questions
None. The agent's decisions below were reviewed and approved by the user on 2026-10-22.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-22 | One screen replaces the table and the edit page: the list of condominiums on the left, the sections of the selected one in the middle, the section menu on the right (the reference system's layout) | the user |
| 2026-10-22 | A pencil on each card edits only that card, with its own Save and Cancel | the user |
| 2026-10-22 | The first section after this screen is the síndico (part 02); the reading options (gas, water, energy) are left out | the user |
| 2026-10-22 | `/condominiums` opens the first condominium of the list; with none, an empty state with "Novo condomínio" | agent (approved) |
| 2026-10-22 | A row of the list reads "0003 - Name" (the code padded to four digits) and "N unidade(s)"; `unit_count` counts all the units of the condominium | agent (approved) |
| 2026-10-22 | The list loads 50 at a time while scrolling; "Ocultar inativos" is on by default and sends `active=true`; the footer shows the total of the current list ("124 condomínios ativos" while the inactive are hidden, "N condomínios" otherwise) | agent (approved) |
| 2026-10-22 | The list's tools: search by name or code (`query`), a jump by code (a field and an arrow that open that condominium; an unknown code says so), the sort control (code or name, ascending or descending, the `?ordering=` of spec 037) and a filter (type and pendency; the status is the "Ocultar inativos" box) | agent (approved) |
| 2026-10-22 | The menu shows only the sections that exist and grows as the parts land: Dados gerais, Taxa de administração, Dados de cobrança and Configurações; it follows the scroll, and a click scrolls to the section | agent (approved) |
| 2026-10-22 | Where today's fields go: the meters (Hidrômetro, Relógio de luz) stay in the Endereço card; the ISS on the fee goes to "Cobrança sobre a taxa de administração"; the issuance day and the exemption of the síndico's unit to "Vencimento e emissão"; the credit limit stays beside the discount ("Desconto e limite"); "Cadastro ativo" becomes "Status do condomínio" in Configurações | agent (approved) |
| 2026-10-22 | Deleting a condominium moves to Configurações ("Excluir condomínio", with the same confirmation), since the list has no row actions | agent (approved) |
| 2026-10-22 | "Novo" opens `/condominiums/new` in the middle area with the existing form; the Blocos, Unidades and Sub-contas pages and their tabs stay as they are | agent (approved) |
| 2026-10-22 | On a phone the list is its own page (`/condominiums`) and the condominium page has a back link and a horizontal row of sections; from 1024 px the three areas show together | agent (approved) |
| 2026-10-22 | Any number of cards may be open for editing at once; each saves alone | agent (approved) |
| 2026-10-22 | Two PRs: the first has the backend `unit_count` and the workspace with the list and the menu around the existing form; the second turns the sections into cards with a pencil (based on the first) | agent (approved) |
| 2026-10-22 | Saving an existing condominium keeps the staff on it (the record is refreshed, so the heading follows the new name); creating one opens the new condominium in the workspace instead of its units page | agent (to be confirmed in the PR) |

## R — Requirements
Staff work on a condominium in one screen, laid out like the reference system's, instead of a table plus a separate edit page.
- [x] R1 — `/condominiums/<id>` shows the list on the left, the sections in the middle and the section menu on the right (together from 1024 px); `/condominiums` opens the first condominium of the list, or an empty state with "Novo condomínio"
- [x] R2 — Each row of the list shows "NNNN - name" and "N unidade(s)", and the selected one is highlighted; the list has the search by name or code, the jump by code, "Ocultar inativos" (on), the sort and the filter, loads 50 at a time while scrolling and shows the total in its footer
- [x] R3 — `GET /api/condominiums/` carries `unit_count`, read only, from the same query (no query per row)
- [x] R4 — The section menu lists the sections, highlights the one in view while scrolling and scrolls to the one clicked
- [ ] R5 — Each section is made of read-only cards with a pencil (an empty value reads "Não informado"); the pencil opens only that card, with Save and Cancel; saving sends only that card's part, shows the server's errors on the fields and refreshes the card and the list row; Cancel discards the changes
- [ ] R6 — Nothing editable today is lost: every field of the current form is reachable in a card, and the late interest rates and the ideal fractions keep working
- [x] R7 — On a phone the list is its own page and the condominium page has a back link and a horizontal row of sections; nothing overflows at 320 px
- [x] R8 — The table, its filters and the edit page are gone; the creation page, the Blocos, Unidades and Sub-contas pages and their tabs stay

## E — Entities
No schema change. The condominium payload gains `unit_count` (integer, read only).

## A — Approach
- A Next layout in a route group `(workspace)` hosts the list, so it stays mounted while the staff moves from one condominium to another; the selected one comes from the route. The middle page is a Server Component that fetches the record as the edit page does today (`fetchOrNotFound`).
- The list is a client component over the generated client with an infinite query; its first paint shows skeleton rows (the one exception to "prefetch what the first paint reads", noted in `norms/data-and-cache.md`).
- The cards reuse the form schema (`lib/schemas/condominium.ts`: `condominiumToForm`, `condominiumToPayload`) and the existing section components as their editors. A card's form is built from the whole record and sends only its own part of the payload; a nested object (address, contract, billing rules) goes whole, as `architecture/api.md` requires.
- Rejected: one form with anchors only (the user chose the pencil); a modal per card (it loses the place in the scroll); counting the units on the client (one request per row).

## S — Structure
Backend:
- `apps/condominiums/views/condominium_views.py`: `Count("units")` annotated as `unit_count` on the queryset.
- `apps/condominiums/serializers/condominium_serializers.py`: the read-only field; an instance that was just created or updated has no annotation, so it counts its units.

Frontend (`app/(dashboard)/condominiums/`):
- `(workspace)/layout.tsx` (the list and the area for the page), `(workspace)/page.tsx` (opens the first condominium), `(workspace)/[id]/page.tsx` (the sections and the menu), `(workspace)/new/page.tsx` (the creation form).
- `_components/workspace/`: `CondominiumList` (with `CondominiumListTools` and `CondominiumListRows`), `SectionMenu`, `sections.ts`, `use-active-section.ts`, `OpenFirstCondominium`, `BackToList`; `hooks/use-condominium-list.ts` (the panel's state and its infinite query); `lib/condominium-list.ts` and `lib/active-section.ts` (the pure parts). Second PR: `SectionCard` and `_components/cards/`, one card per block of each section.
- Gone: `CondominiumsTable`, `CondominiumRow`, `CondominiumsFilters` and the edit page. The client is regenerated.

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/condominiums/` | `?active=`, `?query=`, `?ordering=`, `?page=`, `?limit=` | the page, each row with `unit_count` | the filters already exist |

## O — Operations
First PR:
1. Annotate and expose `unit_count`; tests.
2. Regenerate the client.
3. The workspace layout with the list and the menu; the existing form in the middle (the menu scrolls to its sections).
4. Remove the table and its filters; update the docs.

Second PR (based on the first):
5. Read-only cards with a pencil and one form per card, replacing the single form.
6. The phone layout.
7. Docs; close the spec into `features/history.md`.

## N — Norms
Components stay near 100 lines and split by card; tokens only; user text in Portuguese; generated hooks only; interactive elements keyboard operable (`conventions/practices.md`, `frontend/docs/norms/components.md`).

## S — Safeguards
- Scoping: the list and the record keep the company scoping of `CompanyScopedViewSetMixin`; `unit_count` counts only the units of a condominium the user can already see.
- Performance: one annotated query for the page (no query per row); the list loads 50 at a time.
- Integrity: a card sends only its part, and the nested objects whole, so a partial save never blanks the fields of the same object.
- Accessibility: the menu is a `nav` labeled "Seções do condomínio" with `aria-current` on the section in view; the list is a list of links with `aria-current="page"` on the selected one; each card is a `section` named by its heading, and the pencil is a button with an `aria-label` ("Editar" and the card's name).
- Failure modes: an unknown id is a 404 page as today; a failed list load shows a retry; a failed save keeps the card open with the errors on its fields.
- Compatibility: `/condominiums/<id>` and `/condominiums/new` keep their addresses, so bookmarks work.

## Test plan
| Criterion | Test |
|---|---|
| R1 | none automated (the layout was driven in a browser): a gap written down |
| R2 | `frontend/tests/condominium-list.test.mjs` (the padded code, the units and the footer total, the typed code, the pendency from the address); the search, jump, filters and loading were driven in a browser |
| R3 | `apps/condominiums/tests/test_api_list.py::test_the_list_carries_the_unit_count`, `::test_a_saved_condominium_answers_its_unit_count` and `::test_the_unit_count_costs_no_query_per_row` |
| R4 | `frontend/tests/active-section.test.mjs` (which section is in view for a set of positions) |
| R5 | `frontend/tests/condominium-card.test.mjs` (the part of the payload each card sends); the editing was driven in a browser |
| R6 | none automated: a checklist of every field of the old form, driven in a browser |
| R7 | none automated: driven in a browser at 375 and 320 px |
| R8 | none automated (files removed; `tsc` and `pnpm build` prove no reference is left) |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes; client regenerated; `tsc`, `eslint --max-warnings=0`, `pnpm test` and `pnpm build` clean
- [ ] `docs/apps/condominiums.md`, the frontend docs (`structure/component-patterns.md`, `norms/data-and-cache.md`, `requirements/product-scope.md`) and the roadmap part and phase updated
- [ ] The screens were driven in a browser (cards, menu, list, phone) and what was not checked is written down
