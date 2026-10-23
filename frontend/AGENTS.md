<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend index

Next.js App Router + TypeScript + Tailwind v4 + TanStack Query. This file is only the **index**; knowledge lives in [`docs/`](docs/README.md),
organized by the SPDD REASONS canvas.

## How to work

1. **Do not explore the project on your own** (no folder listing, no code search, no inferring conventions from existing files).
2. **Read headers first**: every doc starts with a 5-line header (`summary`, `read-when`, `skip-if`); read only its first 6 lines to decide, and follow `skip-if` redirects instead of reading further (see the root `AGENTS.md`).
3. Open [`docs/README.md`](docs/README.md), find your task in its **Task → files** table and read **only those files** (usually 2–3).
4. Read source files only when a doc gives the path or you are already changing that file.
5. Not in the docs? **Ask the user**, then record the answer in the right doc.
6. Changed something a doc describes? **Update that doc in the same change.**

## Always true

- Code in English; everything the user reads in Portuguese (pt-BR). Docs and this file in English.
- ERP pages render on the client: a `page.tsx` makes no API call (not even the home); `"use client"` for what calls the API or interacts.
- Style only with design tokens. Never edit `lib/api/generated/` (regenerate with `pnpm generate:api`).
- Before finishing: `pnpm exec tsc --noEmit` · `pnpm exec eslint .` · `pnpm build`.

## Map (REASONS)

| | Folder | Use it for |
|---|---|---|
| R | [`docs/requirements/`](docs/requirements/product-scope.md) | what the app must do, scope, non-functional requirements |
| E | [`docs/entities/`](docs/entities/domain-model.md) | entities, fields, enums, business rules |
| A | [`docs/approach/`](docs/approach/architecture.md) | stack, decisions and why, data flow |
| S | [`docs/structure/`](docs/structure/folders-and-routes.md) | folders, routes, component patterns |
| O | [`docs/operations/`](docs/operations/new-resource-page.md) | step-by-step recipes |
| N | [`docs/norms/`](docs/norms/components.md) | conventions: components, forms, data, design, libraries |
| S | [`docs/safeguards/`](docs/safeguards/checklist.md) | security, performance, accessibility, quality gate |
