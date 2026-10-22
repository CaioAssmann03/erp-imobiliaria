---
summary: Generated API client, request path, QueryClient, hydration, lists, invalidation rules.
read-when: you call the API, prefetch, hydrate or invalidate
skip-if: advanced query/mutation usage → norms/tanstack-query.md; auth in requests → safeguards/auth-and-tokens.md
---
# Data, API client and cache (N — Norms)

## Generated client
Hooks come from orval (`pnpm generate:api`, backend running); `lib/api/generated/` is wiped on regenerate: **never edit**.

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
Defaults: `staleTime 60s`, `refetchOnWindowFocus false`, and `retry: shouldRetry` (`lib/query/make-query-client.ts`): a 4xx answer (not found, forbidden, invalid) is never retried, a network error or a 5xx is retried twice. A `MutationCache.onSuccess` invalidates the cached global searches after **any** successful mutation (a record that was just created must be findable), so a form does not invalidate the search by hand.

## Hydration
`prefetchQuery` in `page.tsx` + `<HydrationBoundary state={dehydrate(queryClient)}>`. Key = hook + params, so server and client must use
**identical params** (`DEFAULT_PAGE_SIZE` from `lib/pagination.ts`). Prefetch independent queries with `Promise.all`. **Everything that reads the cache must sit inside the `<HydrationBoundary>`, the page header included** (a dialog in `PageHeader` actions that reads a list was refetching it). Every client query a page's form or table makes on first paint needs its prefetch with the same key: the pickers of a new-record form (`condominiums`, `suppliers`...), and the dependent ones of an edit form (the plan's cost centers and the templates of each item's cost center). A way to check it: load the page in a browser and count the `/api/` calls the client makes; a fully prefetched page makes none (conditional sections, like the receipts of a paid account, are the exception). Failed prefetch: let the
client fetch; for the dashboard use `fetchQuery(...).catch(() => undefined)`.

The condominium panel of the workspace (spec 038) is the one list that is not prefetched: it lives in a layout, which does not know the page's params, and its first paint shows skeleton rows.

## Detail pages
A `[id]` page fetches its record with `fetchOrNotFound(queryClient, get…RetrieveQueryOptions(id))` (`lib/query/fetch-or-not-found.ts`): the result stays in the cache that hydrates the client, a 404 (missing, or another company's) becomes `notFound()` instead of an empty form, and any other error goes to `app/(dashboard)/error.tsx` (retry). `app/(dashboard)/loading.tsx` is the skeleton shown at once on a page change, and `not-found.tsx` the page for an address or record that does not exist.

## The dashboard is not in the client cache
`/` is a Server Component that fetches the summary on every visit (`fetchQuery(...).catch(() => undefined)`), then hands it to the widgets. Invalidating `getDashboardRetrieveQueryKey()` in the browser therefore changes nothing (those calls in the mutation hooks are harmless leftovers); the page is fresh on the next visit because dynamic routes are not kept in the Router Cache. Its focus views fetch their own lists with client queries (for example the open accounts payable), which the list invalidations already cover.

## Lists
Search/filters/page are query params (`hooks/use-list-params.ts`); `placeholderData: keepPreviousData`; debounce search
(`useDebouncedValue`); deleting the last item of the last page goes back a page. Sorting is the `ordering` param
(`hooks/use-list-sort.ts`): the initial order is left out of the request, so the first load keeps the prefetch key, and a new order goes back to page 1.
A list that loads more while it scrolls is an infinite query: `orval.config.ts` turns it on per operation (`useInfinite`, page param `page`; today `condominiums_list` → `useCondominiumsListInfinite`, in `hooks/use-condominium-list.ts`). Its key is `['infinite', '/api/condominiums/', params]`, which does **not** start with the normal list key, so a mutation that changes a condominium (or its units, whose count the rows show) invalidates `getCondominiumsListInfiniteQueryKey()` besides `getCondominiumsListQueryKey()`.

## Invalidate after mutation (generated key functions, never strings)
| Mutation | Invalidate |
|---|---|
| condominium | list, infinite list, record, dashboard |
| unit | list, record, dashboard, and the condominiums' infinite list (the count in its rows) |
| unit link | the unit record, dashboard |
| account payable (create/edit/cancel) | list, record, dashboard |
| settle an account payable | list, record, dashboard, current accounts, entries |
| attach or delete a payment receipt | the receipts list of that account (`getPaymentReceiptsListQueryKey({ account_payable })`) |
| manual entries / reversal | entries, current accounts (and batches) |
| person | list, record, dashboard |

## Files (payment receipts)
A file never goes through the Next proxy (it carries JSON only). The flow is: `useAccountsPayableReceiptsCreate` returns a signed URL, `uploadToBucket` (`lib/payment-receipts.ts`) `PUT`s the file straight to the bucket, `usePaymentReceiptsConfirm` makes the backend check it. That `PUT` is the one call outside the generated client on purpose: the URL is signed and must **not** carry the session token. A download asks for a fresh signed URL (`staleTime: 0`) and navigates to it. Errors of calls that are not forms use `apiErrorMessage` (`lib/form-errors.ts`).

## Do not
Copy cache into `useState` (use form `reset`) · duplicate a query under another key · raise global `staleTime` to hide a problem ·
store business data or tokens in `localStorage` · share a `QueryClient` across requests on the server.
