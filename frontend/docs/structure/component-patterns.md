---
summary: Anatomy of a list, a form, related-records section and dashboard widget.
read-when: you build a list, form or widget
skip-if: step-by-step for a whole resource → operations/new-resource-page.md; component rules → norms/components.md
---
# Component patterns (S — Structure)

## List (`app/<route>/_components/`)

```
XxxTable.tsx    client  query (useXxxList), delete, pagination; composes the rest
XxxFilters.tsx  client  search + FilterMenu (values/callbacks by props)
XxxRow.tsx      client  one row (ConfirmDeleteButton, RowLink, RowActions)
```
`page.tsx` (server) prefetches and renders `<HydrationBoundary><XxxTable/></HydrationBoundary>`; its prefetch params must equal the ones the table sends (including `module` for people), or the cache does not hydrate.
The first column of the people list is the read-only `ID` (`code`: `hidden md:table-cell`, `tabular-nums`) and the row's mobile `sub` line starts with `ID n`; the search placeholder says it accepts the ID. The condominium list is not a table: it is the workspace's side panel (next section) and shows the code as `NNNN - name`. A unit has no ID (it is its condominium plus its number). Anything that lists or offers people (list, `PersonPicker`, search) sends `module=condominiums` from `lib/person-module.ts`.
State: `hooks/use-list-params.ts`. Blocks: `components/data-list/` (`Toolbar`, `SearchField`, `RowLink`,
`RowActions`, `ListState`, `SortableHead`), `FilterMenu`, `Pagination`. Sortable columns: `SortableHead` puts `aria-sort` on the `th` and the arrow in its button; `hooks/use-list-sort.ts` keeps the state (`lib/list-sort.ts` is the pure part) from a `SortConfig` that holds the initial state, which is the server's default order and is never sent, and the `ordering` value of each column. No list uses them today (the condominium list sorts through a menu, in the workspace), so they wait for the next table that needs a click on the header. Sections with sub-pages (Condomínios, Financeiro) share `components/SectionTabs.tsx` (underlined, collapsible tabs). Periods (due date, entry date) are ready-made options of the `FilterMenu`, never loose date inputs. Filter values are English (`status=active`).

## Workspace (a list beside the record) — condominiums, spec 038

```
(workspace)/layout.tsx      server  PageHeader + the list (in Suspense, it reads ?pending=) + the area for the page
(workspace)/page.tsx        server  /condominiums: reads the first row of the list, OpenFirstCondominium opens it (phone: shows the list)
(workspace)/[id]/page.tsx   server  the record (fetchOrNotFound) with the form and the SectionMenu
(workspace)/new/page.tsx    server  the creation form
_components/workspace/      client  CondominiumList (+ Tools, Rows), SectionMenu, use-active-section, sections.ts, BackToList
hooks/use-condominium-list.ts   the panel's state (search, order, filters, "Ocultar inativos") and the infinite query
```
The layout keeps the list mounted while the staff moves from one record to another; the selected row comes from `useParams`. The list asks 50 rows at a time; its "Mostrar mais" button loads the next page by itself when scrolled into view (`IntersectionObserver`) and also works by hand; it starts with the inactive hidden (`active=true`) and ordered by `code`. It shows skeleton rows on first paint: it is the one list that is not prefetched (it lives in the layout, which has no params of the page). From 1024 px the three areas show together; on a phone `/condominiums` is the list alone and a record has a back link (`BackToList`) and a horizontal row of sections. `SectionMenu` is a `nav` ("Seções do condomínio") whose items scroll to the section ids of `sections.ts`; `use-active-section` marks the one under a reading line (`lib/active-section.ts` is the pure part, tested by `tests/active-section.test.mjs`). The code/units/total texts are in `lib/condominium-list.ts` (`tests/condominium-list.test.mjs`).

## Form

```
XxxForm.tsx                        client  useForm + load record + compose sections
xxx-form/IdentificationSection.tsx client  one block of fields (useFormContext/useWatch)
xxx-form/use-xxx-submit.ts         client  mutations, invalidation, toast, redirect
```
Plus `lib/schemas/<resource>.ts` (schema, `xxxToForm`, `xxxToPayload`). Rules: norms/forms.md.

## Related records (unit + people)

The parent form owns its fields; the related collection is its own section (`unit-people/`) with list, add
form and mutation hooks, and calls `onChanged` so the parent invalidates the parent query.

## Dashboard widget (`app/(dashboard)/_components/home/widgets/`)

`xxx-widget.tsx` exports `buildXxxWidget(dash)` → `{ title, className, showHeader, render(large) }`.
Register in `widgets/types.ts` (`WIDGET_IDS`) and `widgets/index.ts`; add a `lib/search-index.ts` entry. `render(large)` draws the card; the focus modal (`/?focus=<id>`) draws `renderFocus()` when the widget defines it (a richer view with more data: totals, breakdowns, a filterable list, shortcuts, under `widgets/focus/`), and falls back to `render(true)` (the card enlarged) otherwise.

## Floating UI

Base UI primitives (`@base-ui/react`); overlays use the `glass` utility; close on `Esc` and outside click.
