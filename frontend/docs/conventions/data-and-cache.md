---
summary: Generated API client, request path, QueryClient, client-side fetching, detail pages, lists (server-side filtering), queries/mutations, invalidation and file uploads.
read-when: you call the API, fetch on the client, write a query or mutation, build a list, or invalidate the cache
skip-if: forms and server errors → conventions/forms.md; auth in requests → quality/auth-and-tokens.md
---
# Data, API client and cache

## Generated client

Hooks come from orval (`pnpm generate:api`, backend running); `lib/api/generated/` is wiped on regenerate: **never edit**.

| Use | Name (resource `condominiums`) |
|---|---|
| list / detail | `useCondominiumsList(params)` / `useCondominiumsRetrieve(id)` |
| create / edit / delete | `useCondominiumsCreate`, `useCondominiumsPartialUpdate`, `useCondominiumsDestroy` |
| cache key | `getCondominiumsListQueryKey()`, `getCondominiumsRetrieveQueryKey(id)` |
| types | `import type { Condominium } from "@/lib/api/generated/models"` |

Never write loose `fetch`/`axios` for API endpoints; never redeclare response types; ask the backend for new fields and regenerate. Use `useQuery`/`useMutation` directly only for non-API async work.

## Request path (`lib/api/mutator.ts`, `lib/api/api-client.ts`)

axios via `customInstance`; the query `signal` aborts stale requests. The base URL is the browser's own origin (`/api/...`, served by the Next handler that holds the HttpOnly token and adds `Authorization: Bearer`); no page calls Django from the server. A browser 401 means the session ended: go to `/login` (`/api/auth/*` is excluded: there 401 = bad credentials). See `quality/auth-and-tokens.md`.

## QueryClient (`lib/query/`)

Browser only: `getBrowserQueryClient()` singleton (no server query client). Defaults: `staleTime 60s`, `refetchOnWindowFocus false`, `retry: shouldRetry` (a 4xx is never retried; a network error or 5xx is retried twice). A `MutationCache.onSuccess` invalidates the cached global searches after **any** successful mutation, so a form does not invalidate the search by hand. Provider: `app/providers.tsx`. Keys must be serializable.

## Fetching on the client

ERP pages do not prefetch or hydrate: the table or form calls the generated hook in the browser and shows a skeleton (`ListState`, `FormSkeleton`). A page that reads the URL in a client component wraps it in `<Suspense fallback={<ListFallback/>}>`. This includes the home: `DashboardHome` reads `useDashboardRetrieve()`, and until it arrives (or if it fails) the cards show "–". **Do not add `prefetchQuery` / `HydrationBoundary` / `initialData` anywhere.**

## Detail pages

A `[id]` page only passes the `id`. The form (or a `…Detail` component for a read-only page) loads the record with `use…Retrieve(id)` and calls `throwIfPageError(error)` (`lib/query/page-error.ts`) during render: a 404 renders `not-found.tsx`; a 403, 410, 429, 5xx or network failure (after the retries) goes to `error.tsx`, which shows the screen of that code; any other error is shown by the form. A header that needs the record (the `ID` of a person) uses a tiny client component with the same hook: same key, one request. A read-only view must invalidate the record key instead of `router.refresh()`.

## Queries

- A changed param is a new key. `enabled` pauses/chains queries.
- `placeholderData: keepPreviousData` for paginated/filtered lists; `select` for cheap derived data, not `useEffect` + `useState`.
- `isLoading` first load; `isFetching` any fetch; `isPlaceholderData` while showing previous data.
- Never put server data in `useState`; never read `getQueryData` to render.

## The backend owns the logic

The client sends parameters and presents the answer. It does not decide.

- **Filter, search, sort, paginate, aggregate** (totals, balances, counts, rankings, "overdue", "current link"): the endpoint does it. Need a new criterion or figure? Add it to the backend (with a test), regenerate, send the param.
- **Business rules and validation**: the server is the truth. Zod rules in the client are only for fast feedback and must mirror the backend (`domain-model.md` lists the ones the UI shows); always handle the server 400.
- **No big client-side work**: never download a whole collection to filter, group or sum it in the browser, and keep the filter UI small (a handful of filters of the entity itself, in `CompactFilter`). A previewed value (a launch's per-unit amounts) comes from a backend `preview` endpoint, not from a client copy of the formula.
- A client mirror of a backend rule is allowed only when the screen needs an instant example (for instance `lib/billing/billing-example.ts` mirrors the due/competence month table). Mark it as a mirror, keep it tested, and let the server answer win.

## Lists

Search, filters and page are query params (`hooks/use-list-params.ts`); debounce the search (`useDebouncedValue`); deleting the last item of the last page goes back a page.

**Never filter, search, sort or paginate what the API returned on the client** (spec 064). Every criterion is a query param of the endpoint and every list is paginated by the API (`useGrowingLimit` + `ShowMore` send `limit`; the total is `data.count`). If the endpoint lacks the param, **add it to the backend** (a `FilterSet` field or `search_fields`, with a test), regenerate the client and send it. Do not `.filter(...)` the `results`, `.slice` a big fetch into pages, compare dates or names in the browser to decide which records belong (a link is `is_current` because the API says so), or `.sort` a page to decide which come first (report endpoints take `rows_order` / `condominiums_order`).

Allowed on the client: presenting what one response already is (grouping a person's links, a dropdown narrowing the few options of a closed select as you type, a static catalog such as the reports list or the navigation search). `tests/server-side-filters.test.mjs` fails on a list that filters `results`.

## Mutations

```tsx
mutation.mutate({ id, data: payload }, {
  onSuccess: () => invalidate(id),
  onError: (error) => toast.error(applyServerErrors(error, setError)),
});
```

- Invalidate in `onSuccess` with the generated key functions, never strings, never in render. `mutation.isPending` disables the submit.
- No optimistic updates (the rules live on the server); if ever added, roll back in `onError` and invalidate in `onSettled`.

| Mutation | Invalidate |
|---|---|
| condominium, unit, person | list, record, dashboard |
| unit link | the unit record, dashboard |
| account payable (create/edit/cancel) | list, record, dashboard |
| settle an account payable | list, record, dashboard, current accounts, entries |
| attach or delete a payment receipt | `getPaymentReceiptsListQueryKey({ account_payable })` |
| manual entries / reversal | entries, current accounts, batches |

**Invalidation rules.** The table is not exhaustive; the rule is: after a successful mutation, invalidate (a) its list, (b) its record, (c) the dashboard when a card shows the figure, and (d) every resource whose numbers it changes (a settled payable moves the statement; issuing a month adds documents and a run). Use the key functions of the generated client; the owner of the mutation owns the invalidation. After logout the cache is cleared (`queryClient.clear()`), so no data of one session survives into the next.

**Where state may live.** Server data lives only in the query cache. `useState` is for UI state, never a copy of query data. `localStorage` is only for per-browser conveniences the server never needs (rail expanded, dashboard card layout, assistant switch); never business data, tokens or PII; appearance is cookies. The URL carries scope and filters (`?condominium=`, `?month=`, `?page=`), so a reload or a shared link reproduces the screen.

**Known exceptions** (debt, not a pattern to copy): *Conta da imobiliária* has no condominium filter in the API, so its list searches the condominium name and confirms the exact name on the client; *Boleto extra* loads the active units page by page in the browser to build its `units` list. Both should become backend criteria/rules.

## Files (payment receipts)

A file never goes through the Next proxy (JSON only). `useAccountsPayableReceiptsCreate` returns a signed URL, `uploadToBucket` (`lib/finance/payment-receipts.ts`) `PUT`s the file straight to the bucket, `usePaymentReceiptsConfirm` makes the backend check it. That `PUT` is the one call outside the generated client on purpose: the URL is signed and must **not** carry the session token. A download asks for a fresh signed URL (`staleTime: 0`). Errors of calls that are not forms use `apiErrorMessage` (`lib/errors/form-errors.ts`).

## Do not

Copy cache into `useState` (use form `reset`) · duplicate a query under another key · raise the global `staleTime` to hide a problem · store business data or tokens in `localStorage` · share a `QueryClient` across requests on the server.
