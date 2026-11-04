<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend index

Next.js App Router + TypeScript + Tailwind v4 + TanStack Query. This file is only the **index**; knowledge lives in [`docs/`](docs/README.md),
organized by purpose (structure, conventions, features, guides, quality).

## How to work

1. **Do not explore the project on your own** (no folder listing, no code search, no inferring conventions from existing files).
2. **Read headers first**: every doc starts with a 5-line header (`summary`, `read-when`, `skip-if`); read only its first 6 lines to decide, and follow `skip-if` redirects instead of reading further (see the root `AGENTS.md`).
3. Open [`docs/README.md`](docs/README.md), find your task in its **Task → files** table and read **only those files** (usually 2–3).
4. Read source files only when a doc gives the path or you are already changing that file.
5. Not in the docs? **Ask the user**, then record the answer in the right doc.
6. Changed something a doc describes? **Update that doc in the same change.**

## Always true

- Code in English; everything the user reads in Portuguese (pt-BR). Docs and this file in English.
- **Pages are server shells, interactivity is small client islands.** A `page.tsx` makes no API call (not even the home); what fetches or interacts is a small `"use client"` component under it, using the generated hook (`docs/conventions/components.md`).
- **The backend owns the logic.** Filter, search, sort, paginate, totals and business rules are API params and endpoints; the client never filters or aggregates a list's `results` and keeps its filters small. A missing criterion is added to the backend first (`docs/conventions/data-and-cache.md`).
- Cache: generated hooks and key functions only, no prefetch, invalidate after every mutation, never copy query data into state.
- Registry screens (condominiums, units, blocks, sub-contas, persons, events, billing, finance) use the 3-column layout: a frame in `layout.tsx` draws the list and the right menu, a page renders only its content (`docs/structure/registry-layout.md`).
- Style only with design tokens. Never edit `lib/api/generated/` (regenerate with `pnpm generate:api`).
- Before finishing: `pnpm exec tsc --noEmit` · `pnpm exec eslint .` · `pnpm test` · `pnpm build`.

## Map

| Folder | Use it for |
|---|---|
| [`docs/overview.md`](docs/overview.md), [`docs/domain-model.md`](docs/domain-model.md) | the big picture and stack; entities, enums, business rules |
| [`docs/structure/`](docs/structure/folders.md) | folders, routes, the 3-column registry layout |
| [`docs/conventions/`](docs/conventions/components.md) | components, data and cache, forms, design system, code style |
| [`docs/features/`](docs/features/marketing.md) | the public site, the help assistant |
| [`docs/guides/`](docs/guides/recipes.md) | recipes and the finish checklist |
| [`docs/quality/`](docs/quality/auth-and-tokens.md) | auth, secure coding, accessibility and SEO, performance |
