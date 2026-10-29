---
summary: Generated API client, request path, QueryClient, client-side fetching, lists, invalidation rules.
read-when: you call the API, fetch on the client or invalidate
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
| types | `import type { Condominium } from "@/lib/api/generated/models"` |

Same pattern for `persons`, `units`, `unit-people`, `blocks`, `companies`, plus `dashboard`, `search`, `auth`.
Never write loose `fetch`/`axios` for API endpoints; never redeclare response types; filter/search/paginate on the server;
ask the backend for new fields and regenerate.

## Request path (`lib/api/mutator.ts`, `lib/api-client.ts`)
axios via `customInstance`; the query `signal` aborts stale requests. Base URL: the browser's own origin (`/api/...`, served by the Next handler that holds the HttpOnly token and adds `Authorization: Bearer`); no page calls Django from the server. Browser 401 → the session ended: go to `/login` (the handler already tried to renew); `proxy.ts` also renews on a page load. `/api/auth/*` is excluded (401 = bad credentials). See safeguards/auth-and-tokens.md.

## QueryClient (`lib/query/`)
Browser only: `getBrowserQueryClient()` singleton (there is no server query client: no page prefetches).
Defaults: `staleTime 60s`, `refetchOnWindowFocus false`, and `retry: shouldRetry` (`lib/query/make-query-client.ts`): a 4xx answer (not found, forbidden, invalid) is never retried, a network error or a 5xx is retried twice. A `MutationCache.onSuccess` invalidates the cached global searches after **any** successful mutation (a record that was just created must be findable), so a form does not invalidate the search by hand.

## Fetching on the client
ERP pages do not prefetch or hydrate: the table or form calls the generated hook in the browser and shows a skeleton (`ListState`, `FormSkeleton`) while it loads. A page that reads the URL in a client component wraps it in `<Suspense fallback={<ListFallback/>}>`. A page that waits for nothing on the server paints its shell at once; the cache keeps `staleTime 60s`, so going back to a list is instant.

This includes the home (`/dashboard`): `DashboardHome` reads `useDashboardRetrieve()`. Do not add `prefetchQuery` / `HydrationBoundary` to any page.

## Detail pages
A `[id]` page only passes the `id`. The form (or a `…Detail` component for a read-only page) loads the record with `use…Retrieve(id)` and calls `throwIfNotFound(error)` (`lib/query/not-found.ts`) during render: a 404 (missing, or another company's) renders `app/(dashboard)/not-found.tsx` instead of an empty form, and any other error is retried per `shouldRetry` and then shown by the form or `app/(dashboard)/error.tsx`. A page header that needs the record (the `ID` of a person or condominium) uses a tiny client component with the same hook (`PersonCode`, `CondominiumCode`): same key, one request. `app/(dashboard)/loading.tsx` is the skeleton shown at once on a page change. A read-only view that used `router.refresh()` must invalidate the record key instead (`getBillingDocumentsRetrieveQueryKey(id)`).

## The dashboard
`/` is a static shell (`PageHeader`) plus `DashboardHome` (client): the summary comes from `useDashboardRetrieve()` and, until it arrives or if it fails, the widgets show "–". The registers summary ("8 condomínios (7 ativos), 53 unidades…") is not a card: `RegistrySummary` writes it as the page description, each total linking to its list, and falls back to the usual description while loading or on failure; "Nova pessoa" and "Novo condomínio" are the header actions. The `condominiums` widget stays only as the focus view (`?focus=condominiums`, Spotlight). The mutation hooks invalidate `getDashboardRetrieveQueryKey()`, which now refreshes the cached summary. The focus views (`?focus=`) fetch their own lists with client hooks (for example the open accounts payable), which the list invalidations already cover.

## Lists
Search/filters/page are query params (`hooks/use-list-params.ts`); `placeholderData: keepPreviousData`; debounce search
(`useDebouncedValue`); deleting the last item of the last page goes back a page.

## Invalidate after mutation (generated key functions, never strings)
| Mutation | Invalidate |
|---|---|
| condominium | list, record, dashboard |
| unit | list, record, dashboard |
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
