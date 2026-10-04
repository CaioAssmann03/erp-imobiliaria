---
read-when: you create or change a component, or decide Server vs Client
size: medium
---
# Components (N — Norms)

## Server or Client
**Server Component is the default.** Add `"use client"` only for: state/effects/refs/event handlers,
TanStack Query hooks, react-hook-form, `useRouter`/`usePathname`, browser APIs, browser-only libs (charts, Base UI dialogs).

| Server | Client |
|---|---|
| `page.tsx`, `layout.tsx`, `metadata`, prefetch + `HydrationBoundary` | forms and sections, filters, searchable tables |
| `PageHeader`, static text, stateless cards, read-only lists | delete buttons, modals, menus, charts, `WidgetCard`, `GlobalSearch` |

1. Keep the client boundary **low**: a server component may render a tiny client one; do not mark a tree client for one `onClick`.
2. `"use client"` makes everything the file imports client-side; extract the interactive part into its own file.
3. Client code never imports server-only code (`next/headers`); server code never uses hooks.
4. Data arrives by props or the hydrated query; do not `fetch` in the client what the page can prefetch.
5. Props crossing server → client must be serializable. To put server content inside a client shell, pass it as `children`.

## Placement
One route → `app/<route>/_components/`; two or more → `components/`; dashboard layout → `_components/shell/`; home → `_components/home/`;
shadcn primitives → `components/ui/` (add with `npx shadcn add`, do not edit casually).

## Size and responsibility
- One component per file, ~100 lines max; beyond that, split. One job: load, compose, or render one piece.
- Pass only needed props (values, not whole objects). Local state stays local; lift only when siblings need it.
- A form section reads the form with `useFormContext`/`useWatch` (never `control`/`register` by props).
- The component that owns a mutation owns the cache invalidation.
- Prefer composition (`children`, slot props) over flag props.

## Styling
Tokens only (`bg-surface`, `text-ink-soft`, `rounded-card`); no hex, no `text-sm`/`rounded-xl`. `cn()` joins classes.
Variants via `components/ui` props. Mobile first; hide secondary columns with `hidden md:table-cell`.
Shared form class strings live in `lib/ui.ts`.

## Done when
Server by default · right folder · ≤ ~100 lines · tokens only · no `any` · Portuguese text · `tsc`/`eslint` clean.
