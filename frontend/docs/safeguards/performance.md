---
summary: Performance techniques: rendering, data, bundle, re-renders, assets, audit list.
read-when: you care about speed, bundle size or re-renders
skip-if: cache rules → norms/data-and-cache.md
---
# Performance (S — Safeguards)

Measure first (React Profiler, Network tab, `next build` output). **done** = already in the project; **do** = apply when relevant.

| Technique | Status | Rule |
|---|---|---|
| Server shell, data fetched on the client | done | the page paints at once with a skeleton; no API call blocks the server render |
| Prerendered static shells | done | most routes are `○` in `next build`: no per-request server work |
| `Suspense` / `loading.tsx` | done | `Suspense` around client components that read `useSearchParams`; skeleton on a page change |
| `next/dynamic` (`ssr:false` + skeleton) | do | charts, big dialogs |
| Server-side search/filter/pagination | done | never download everything to filter |
| `keepPreviousData`, debounce (250–300 ms), request abort | done | no flashes, no request per keystroke |
| No refetch on focus; per-query `staleTime` only when needed | done | |
| Summary endpoints (`/api/dashboard/`) | done | prefer one summary over many list calls |
| Prefetch likely navigation (`Link`, `router.prefetch`) | do | |

**Bundle:** named icon imports; prefer native APIs (`Intl`, `structuredClone`) over utility libs; recharts only in one small client component;
inspect with `@next/bundle-analyzer` (not installed) when investigating; do not import client modules into server pages needlessly.
**Re-renders:** derive during render; keep state local; `useWatch` in the smallest component (no top-level `watch()`); `useMemo`/`useCallback`/`memo`
only after measuring or where identity matters; stable keys; paginate or virtualize long lists.
**Assets:** `next/font` (self-hosted; alternative fonts `preload:false`); `next/image` with sizes, `priority` only above the fold; SVG/CSS for simple art.
**CSS:** never build Tailwind class names dynamically; animate `transform`/`opacity` only.
**Network:** `_next/static` is immutable; API data is per-user, controlled by TanStack Query; compress and use HTTP/2+ at the edge.

Page audit: `page.tsx` makes no API call? · a skeleton while the client query loads? · each `"use client"` file truly interactive and small? · queries debounced, paginated? · heavy lib reachable from a server file? · no state mirroring server data?
