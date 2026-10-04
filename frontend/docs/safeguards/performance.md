---
read-when: you care about speed, bundle size, re-renders, fonts or images
size: small
---
# Performance (S — Safeguards)

Measure first (React Profiler, Network tab, `next build` output). **done** = already in the project; **do** = apply when relevant.

| Technique | Status | Rule |
|---|---|---|
| Server Components by default, small client islands | done | less JS shipped |
| Server prefetch + hydration, `Promise.all` | done | first paint has data; never await independent prefetches in series |
| `Suspense` / `loading.tsx` | do | stream the shell, wrap slow server work |
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

Page audit: server `page.tsx` prefetches first-screen data? · each `"use client"` file truly interactive and small? · queries debounced, paginated, params
equal to prefetch? · heavy lib reachable from a server file? · no state mirroring server data?
