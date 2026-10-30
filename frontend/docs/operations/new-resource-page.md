---
summary: End-to-end recipe to add a CRUD resource (generate client, schema, route files, components, cache, nav).
read-when: you add a new resource page
skip-if: a small task (field, widget, accent) → operations/recipes.md; a module in the 3-column layout (list | content | menu) → structure/three-column-layout.md
---
# Recipe: add a resource (O — Operations)

Example resource `blocks` → route `/blocks`. Do the steps in order; each step names the norm to follow.

1. **Backend first.** The endpoint, serializer and filters must exist. With the backend running:
   `pnpm generate:api` (hooks `useBlocksList`, `useBlocksCreate`, ... and models appear).
2. **Schema** `lib/schemas/block.ts`: Zod schema (field names = API names), `BLOCK_DEFAULTS`,
   `blockToForm`, `blockToPayload(values, isEdit)`.
3. **Route files** under `app/(dashboard)/blocks/`:
   - `page.tsx` (server, no API call): `metadata`, `PageHeader` and `BlocksTable` (inside `<Suspense fallback={<ListFallback/>}>` if the table reads the URL).
   - `new/page.tsx` and `[id]/page.tsx` (server, no API call): `metadata`, `FormPage`, `PageHeader`, form (edit passes the `id`; the form loads the record and calls `throwIfPageError`).
4. **Components** in `blocks/_components/`: `BlocksTable`, `BlocksFilters`, `BlockRow`, `BlockForm`,
   `block-form/*Section.tsx`, `block-form/use-block-submit.ts` (patterns: structure/component-patterns.md).
5. **Cache:** the submit/delete hooks invalidate the list, the record and the dashboard (norms/data-and-cache.md).
6. **Navigation and search:** add an item to a group of `lib/module-menu.ts` (it feeds the rail's module menu and `MobileMenu`; no `href` shows it disabled as "Em breve"); add entries to `lib/search-index.ts`;
   if the global search API should return it, that is a backend change.
7. **Finish:** safeguards/checklist.md (types, lint, build, manual run).

Do not: write `fetch`/`axios` calls, put a component used by one route in `components/`, or hardcode colors.
