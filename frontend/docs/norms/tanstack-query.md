---
read-when: you write or review query/mutation code beyond the standard patterns
size: small
---
# TanStack Query usage (N — Norms)

Use the **generated hooks**; call `useQuery`/`useMutation` directly only for non-API async work.

**Queries**
- Key derives from params; a changed param is a new key. `enabled` pauses/chains queries (advisor record only when `advisorId` exists).
- `placeholderData: keepPreviousData` for paginated/filtered lists. `select` for cheap derived data (memoized), not `useEffect`+`useState`.
- `isLoading` first load; `isFetching` any fetch (subtle "updating" hints); `isPlaceholderData` showing previous data.
- Never put server data in `useState`; never read `getQueryData` to render (the UI would not update).

**Server prefetch**
- `prefetchQuery` never throws; use `fetchQuery` when the page needs the data to render (e.g. a title) and handle failure.
- Prefetch in parallel; params must equal the client hook's, or nothing is hydrated. Do not fake data with `initialData`.

**Mutations**
```tsx
mutation.mutate({ id, data: payload }, {
  onSuccess: () => invalidate(id),
  onError: (error) => toast.error(applyServerErrors(error, setError)),
});
```
- Invalidate in `onSuccess` (record, list, dashboard) with generated key functions; never in render.
- `mutation.isPending` disables the submit button. No optimistic updates (rules live on the server); if added, roll back in `onError`, invalidate in `onSettled`.

**Cancelation**: the mutator passes `signal`; pair search boxes with `useDebouncedValue`.
**Provider**: `app/providers.tsx` → `QueryClientProvider` with `getBrowserQueryClient()`.
**Pitfall**: keys must be serializable (no functions/class instances).
