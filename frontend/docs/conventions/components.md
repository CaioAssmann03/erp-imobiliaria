---
summary: Server vs client, placement, size and styling rules for components, plus the anatomy of a plain list, a form, related records and a dashboard widget.
read-when: you create or change a component, choose server vs client, or build a list, form or widget
skip-if: the 3-column registry (frames, side lists, menus) → structure/registry-layout.md; form mechanics → conventions/forms.md; tokens → conventions/design-system.md
---
# Components

## Pages are server shells, interactivity is small client islands

The core rule of the app:

- A **page** (`page.tsx`, `layout.tsx`) is a server component. It renders the static shell (`metadata`, `PageHeader`, text) and **fetches nothing**, so it is prerendered and paints at once.
- Everything that fetches, reacts or interacts is a **small client component** under it (a table, a form, a filter, a dialog, a chart), fetching with the generated hook and showing a skeleton. Do not turn a page, a layout or a big subtree into a client component to save one `useState`: extract the interactive part.
- Logic does not live in components: payloads, formatting and rules are pure functions in `lib/` or a hook, and anything that decides *which data* (filters, search, order, totals, business rules) lives in the backend (`conventions/data-and-cache.md`).

## Server or client

**Server component is the default.** Add `"use client"` only for state/effects/refs/handlers, TanStack Query hooks, react-hook-form, `useRouter`/`usePathname`, browser APIs and browser-only libs (charts, Base UI dialogs).

| Server | Client |
|---|---|
| `page.tsx`, `layout.tsx`, `metadata` (no data fetching) | forms and sections, filters, searchable tables, anything that calls the API |
| `PageHeader`, static text, stateless cards | delete buttons, modals, menus, charts, `WidgetCard`, `GlobalSearch` |

1. Keep the client boundary **low**: a server component may render a tiny client one; do not mark a tree client for one `onClick`. `"use client"` makes everything the file imports client-side: extract the interactive part.
2. Client code never imports server-only code (`next/headers`); server code never uses hooks.
3. ERP data is fetched in the client component with the generated hook; a page does not prefetch (not even the home).
4. Props crossing server → client must be serializable. To put server content in a client shell, pass it as `children`.

## Placement and size

- One route → `app/<route>/_components/` (one subfolder per resource when there are many; a folder of about a dozen files that belong to one frame/list/detail flow stays flat). Two or more routes → `components/<group>/`. Shadcn primitives → `components/ui/` (add with `pnpm exec shadcn add`, treat as vendored). Folder map: `structure/folders.md`.
- One component per file, ~100 lines max; beyond that, split. One job: load, compose, or render one piece.
- Pass only needed props (values, not whole objects). Local state stays local; lift only when siblings need it.
- A form section reads the form with `useFormContext`/`useWatch` (never `control`/`register` by props).
- The component that owns a mutation owns the cache invalidation.
- Prefer composition (`children`, slot props) over flag props.
- Styling: tokens only, `cn()` joins classes, mobile first (`hidden md:table-cell` for secondary columns), shared class strings in `lib/theme/ui.ts` (`conventions/design-system.md`).

**Done when:** server by default · right folder · ≤ ~100 lines · tokens only · no `any` · Portuguese text · `tsc`/`eslint` clean.

## A plain list (a table page outside the 3-column layout)

```
XxxTable.tsx    client  query (useXxxList), delete, pagination; composes the rest
XxxFilters.tsx  client  search + FilterMenu (values/callbacks by props)
XxxRow.tsx      client  one row (ConfirmDeleteButton, RowLink, RowActions)
```

`page.tsx` (server) renders `PageHeader` and `<XxxTable/>`, inside `<Suspense fallback={<ListFallback/>}>` when the table reads `useSearchParams`. A filter arriving in the URL (`?condominium=`, `?pending=`) is read by the table as the initial filter. State: `hooks/use-list-params.ts`. Blocks: `components/data-list/` (`Toolbar`, `SearchField`, `RowLink`, `RowActions`, `ListState`, `Pagination`), `FilterMenu` (the "Filtros" button with a panel), `ShowMore` + `useGrowingLimit`. Filter values are English (`status=active`). Periods are ready-made options of the filter menu; a day or month in a filter uses the calendar popovers `DateSelect` / `MonthSelect` (typeable `dd/mm/aaaa`), never a native date input.

People and condominiums: the first column is the read-only `ID` (`code`: `hidden md:table-cell`, `tabular-nums`) and the mobile `sub` line starts with `ID n`; search accepts the ID but placeholders do not mention it. A unit has no ID. Anything that lists or offers people sends `person_module=condominiums` (`lib/persons/person-module.ts`).

## A form

```
XxxForm.tsx                        client  RecordForm + load record + compose sections
xxx-form/IdentificationSection.tsx client  one block of fields (useFormContext/useWatch)
xxx-form/use-xxx-submit.ts         client  mutations, invalidation, toast, redirect
```

Plus `lib/schemas/<resource>.ts` (schema, `xxxToForm`, `xxxToPayload`). Rules: `conventions/forms.md`.

## Related records (unit + people)

The parent form owns its fields; the related collection is its own section (`unit-people/`) with list, add form and mutation hooks, and calls `onChanged` so the parent invalidates the parent query.

## Dashboard widget

`widgets/xxx-widget.tsx` exports `buildXxxWidget(dash)` → `{ title, className, showHeader, render(large) }`; register it in `widgets/types.ts` (`WIDGET_IDS`) and `widgets/index.ts`, and add a `lib/navigation/search-index.ts` entry. The focus view (`/dashboard?focus=<id>`) draws `renderFocus()` when defined (richer data, under `widgets/focus/`), else `render(true)`. Data comes from `/api/dashboard/` (a backend change if new). Every list inside a focus view is paginated, 10 per page (`FocusPager`).

## Floating UI

Base UI primitives (`@base-ui/react`); overlays use the `glass` utility and close on `Esc` and outside click.
