---
summary: End-to-end recipe to add a CRUD resource (generate client, schema, route files, components, cache, nav).
read-when: you add a new resource page
skip-if: a small task (field, widget, accent) → operations/recipes.md
---
# Recipe: add a resource (O — Operations)

Example resource `blocks` → route `/blocks`. Do the steps in order; each step names the norm to follow.

1. **Backend first.** The endpoint, serializer and filters must exist. With the backend running:
   `pnpm generate:api` (hooks `useBlocksList`, `useBlocksCreate`, ... and models appear).
2. **Schema** `lib/schemas/block.ts`: Zod schema (field names = API names), `BLOCK_DEFAULTS`,
   `blockToForm`, `blockToPayload(values, isEdit)`.
3. **Route files** under `app/(dashboard)/blocks/`:
   - `page.tsx` (server): `metadata`, prefetch `getBlocksListQueryOptions({ limit: DEFAULT_PAGE_SIZE })`, `PageHeader`,
     `HydrationBoundary` + `BlocksTable`.
   - `new/page.tsx` and `[id]/page.tsx` (server): `metadata`, `FormPage`, `PageHeader`, form (edit also prefetches the record).
4. **Components** in `blocks/_components/`: `BlocksTable`, `BlocksFilters`, `BlockRow`, `BlockForm`,
   `block-form/*Section.tsx`, `block-form/use-block-submit.ts` (patterns: structure/component-patterns.md).
5. **Cache:** the submit/delete hooks invalidate the list, the record and the dashboard (norms/data-and-cache.md).
6. **Navigation and search:** add an item to `nav-items.ts` (it feeds `NavLinks` and `MobileMenu`); add entries to `lib/search-index.ts`;
   if the global search API should return it, that is a backend change.
7. **Finish:** safeguards/checklist.md (types, lint, build, manual run).

Do not: write `fetch`/`axios` calls, put a component used by one route in `components/`, or hardcode colors.
