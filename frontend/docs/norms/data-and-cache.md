---
summary: Generated API client, request path, QueryClient, hydration, lists, invalidation rules.
read-when: you call the API, prefetch, hydrate or invalidate
skip-if: advanced query/mutation usage → norms/tanstack-query.md; auth in requests → safeguards/auth-and-tokens.md
---
# Data, API client and cache (N — Norms)

## Generated client
Hooks come from orval (`npm run generate:api`, backend running); `lib/api/generated/` is wiped on regenerate: **never edit**.

| Use | Name (resource `condominiums`) |
|---|---|
| list / detail | `useCondominiumsList(params)` / `useCondominiumsRetrieve(id)` |
| create / edit / delete | `useCondominiumsCreate`, `useCondominiumsPartialUpdate`, `useCondominiumsDestroy` |
| cache key | `getCondominiumsListQueryKey()`, `getCondominiumsRetrieveQueryKey(id)` |
| server prefetch | `getCondominiumsListQueryOptions(params)`, `getCondominiumsRetrieveQueryOptions(id)` |
| types | `import type { Condominium } from "@/lib/api/generated/models"` |

Same pattern for `persons`, `units`, `unit-people`, `blocks`, `companies`, plus `dashboard`, `search`, `auth`.
Never write loose `fetch`/`axios` for API endpoints; never redeclare response types; filter/search/paginate on the server;
ask the backend for new fields and regenerate.

## Request path (`lib/api/mutator.ts`, `lib/api-client.ts`)
axios via `customInstance`; the query `signal` aborts stale requests. Base URL: browser = its own origin (`/api/...`, served by the Next handler that holds the HttpOnly token), server `API_INTERNAL_URL` (SSR adds `Authorization: Bearer` from the cookie). Browser 401 → the session ended: go to `/login` (the handler already tried to renew); page renewal happens in `proxy.ts`. `/api/auth/*` is excluded (401 = bad credentials). See safeguards/auth-and-tokens.md.

## QueryClient (`lib/query/`)
Server: `getServerQueryClient()` (React `cache`, **one per request**, never shared). Browser: `getBrowserQueryClient()` singleton.
Defaults: `staleTime 60s`, `refetchOnWindowFocus false`.

## Hydration
`prefetchQuery` in `page.tsx` + `<HydrationBoundary state={dehydrate(queryClient)}>`. Key = hook + params, so server and client must use
**identical params** (`DEFAULT_PAGE_SIZE` from `lib/pagination.ts`). Prefetch independent queries with `Promise.all`. Failed prefetch: let the
client fetch; for the dashboard use `fetchQuery(...).catch(() => undefined)`.

## Lists
Search/filters/page are query params (`hooks/use-list-params.ts`); `placeholderData: keepPreviousData`; debounce search
(`useDebouncedValue`); deleting the last item of the last page goes back a page.

## Invalidate after mutation (generated key functions, never strings)
| Mutation | Invalidate |
|---|---|
| condominium | list, record, dashboard |
| unit | list, record, dashboard |
| unit link | the unit record, dashboard |
| person | list, record, dashboard |

## Do not
Copy cache into `useState` (use form `reset`) · duplicate a query under another key · raise global `staleTime` to hide a problem ·
store business data or tokens in `localStorage` · share a `QueryClient` across requests on the server.
