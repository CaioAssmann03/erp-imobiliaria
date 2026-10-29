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
`page.tsx` (server) only renders `PageHeader` and `<XxxTable/>` (inside `<Suspense fallback={<ListFallback/>}>` when the table reads `useSearchParams`); the table fetches in the browser. A filter that arrives in the URL (`?condominium=`, `?pending=`) is read by the table with `useSearchParams` and used as the initial filter.
The first column of the people and condominium lists is the read-only `ID` (`code`: `hidden md:table-cell`, `tabular-nums`) and the row's mobile `sub` line starts with `ID n`; the search placeholder says it accepts the ID. A unit has no ID (it is its condominium plus its number). Anything that lists or offers people (list, `PersonPicker`, search) sends `module=condominiums` from `lib/person-module.ts`.
State: `hooks/use-list-params.ts`. Blocks: `components/data-list/` (`Toolbar`, `SearchField`, `RowLink`,
`RowActions`, `ListState`), `FilterMenu` (the "Filtros" button with a panel, for tables), `CompactFilter` + `FilterSummary` (a small icon inside the search field and a one-line summary, for the side and registry lists), `Pagination`. Sections with sub-pages (Condomínios, Financeiro) share `components/SectionTabs.tsx` (underlined, collapsible tabs). Periods (due date, entry date) are ready-made options of the `FilterMenu`, never loose date inputs. Filter values are English (`status=active`).

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
Register in `widgets/types.ts` (`WIDGET_IDS`) and `widgets/index.ts`; add a `lib/search-index.ts` entry. `render(large)` draws the card; the focus modal (`/dashboard?focus=<id>`) draws `renderFocus()` when the widget defines it (a richer view with more data: totals, breakdowns, a filterable list, shortcuts, under `widgets/focus/`), and falls back to `render(true)` (the card enlarged) otherwise.

## Floating UI

Base UI primitives (`@base-ui/react`); overlays use the `glass` utility; close on `Esc` and outside click.
