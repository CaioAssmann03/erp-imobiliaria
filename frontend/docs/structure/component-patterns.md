---
read-when: you build a list, a form, a related-records section or a dashboard widget
size: small
---
# Component patterns (S — Structure)

## List (`app/<route>/_components/`)

```
XxxTable.tsx    client  query (useXxxList), delete, pagination; composes the rest
XxxFilters.tsx  client  search + FilterMenu (values/callbacks by props)
XxxRow.tsx      client  one row (ConfirmDeleteButton, RowLink, RowActions)
```
`page.tsx` (server) prefetches and renders `<HydrationBoundary><XxxTable/></HydrationBoundary>`.
State: `hooks/use-list-params.ts`. Blocks: `components/data-list/` (`Toolbar`, `SearchField`, `RowLink`,
`RowActions`, `ListState`), `FilterMenu`, `Pagination`. Filter values are English (`status=active`).

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
Register in `widgets/types.ts` (`WIDGET_IDS`) and `widgets/index.ts`; add a `lib/search-index.ts` entry. The same
`render(large)` feeds the card and the focus modal (`/?focus=<id>`).

## Floating UI

Base UI primitives (`@base-ui/react`); overlays use the `glass` utility; close on `Esc` and outside click.
