---
summary: Step-by-step recipes (new resource, regenerate the client, form field, dashboard widget, accent, nav item, auth change) and the checklist to run before finishing any change.
read-when: you add a resource or do a small recurring task, or you are about to finish a change
skip-if: a module in the 3-column layout (list | content | menu) → structure/registry-layout.md section 7; where files go → structure/folders.md
---
# Recipes and checklist

## Before finishing any change

```bash
cd frontend
pnpm exec tsc --noEmit   # types
pnpm exec eslint .       # lint (generated code ignored)
pnpm test                # node:test for pure helpers (tests/*.test.mjs; also runs in CI)
pnpm build               # validates pages, routes, server/client boundaries
```

API changed → backend running → `pnpm generate:api` first. Stale type errors after renaming routes → delete `.next/` and rebuild.

- [ ] Code English, user text Portuguese (`conventions/code.md`)
- [ ] File in the right place, ≤ ~100 lines, logic outside JSX (`conventions/components.md`)
- [ ] `page.tsx` makes no API call; `"use client"` only for what calls the API or interacts
- [ ] Tokens only; works in dark + light and at phone width (`conventions/design-system.md`)
- [ ] Generated hooks only; invalidations cover dependents; no client-side filtering (`conventions/data-and-cache.md`)
- [ ] Schema + `toForm`/`toPayload`; server errors handled (`conventions/forms.md`)
- [ ] No token/PII in logs, storage, props, toasts; links/redirects validated (`quality/secure-coding.md`)
- [ ] Labels, keyboard, focus, `metadata.title` (`quality/accessibility-and-seo.md`)
- [ ] Loading, empty, error and success states handled
- [ ] The doc describing what you changed is updated

Manual: create, edit, delete; client and server validation errors; reload a filtered list; sign out/in; dark/light; narrow viewport.

## Add a CRUD resource (plain pages)

Example resource `blocks` → route `/blocks`. For a registry module (list | content | menu) follow `structure/registry-layout.md` section 7 instead.

1. **Backend first.** Endpoint, serializer and filters must exist. With the backend running, `pnpm generate:api`.
2. **Schema** `lib/schemas/block.ts`: Zod schema (field names = API names), `BLOCK_DEFAULTS`, `blockToForm`, `blockToPayload(values, isEdit)`.
3. **Routes** under `app/(dashboard)/blocks/`: `page.tsx` (server, no API call: `metadata`, `PageHeader`, `BlocksTable` in a `Suspense` if it reads the URL), `new/page.tsx` and `[id]/page.tsx` (`metadata`, `FormPage`, `PageHeader`, the form; edit passes the `id`).
4. **Components** in `blocks/_components/`: `BlocksTable`, `BlocksFilters`, `BlockRow`, `BlockForm`, `block-form/*Section.tsx`, `block-form/use-block-submit.ts` (`conventions/components.md`).
5. **Cache:** the submit/delete hooks invalidate list, record and dashboard (`conventions/data-and-cache.md`).
6. **Navigation and search:** an item in `lib/navigation/module-menu.ts` (feeds the rail's module menu and `MobileMenu`; no `href` shows it disabled as "Em breve"); entries in `lib/navigation/search-index.ts` (what the global search API returns is a backend change).

Do not: write `fetch`/`axios` calls, put a one-route component in `components/`, hardcode colors.

## Regenerate the API client

Backend running → `cd frontend && pnpm generate:api`. If the build then fails on a renamed type, fix the caller (schemas, payload builders), not the generated file. Regeneration wipes and rewrites the folder: a running `next dev` keeps a broken module graph ("Export … doesn't exist in target module", login answering 500). Stop it, delete `frontend/.next`, start it again (in Docker: `docker compose restart frontend`), then `pnpm exec next typegen` so `tsc` finds the route types.

## Add a field to an existing form

1. Backend field exists and the client is regenerated.
2. Add it to the schema, `*_DEFAULTS`, `xxxToForm`, `xxxToPayload` (`lib/schemas/<resource>.ts`).
3. Add the input to the right `*Section.tsx` (`TextField`/`SelectField`/`CheckboxField`, `mask` if needed).
4. Show it in the list row only if the list needs it.
5. Update `domain-model.md` if it is a new rule or enum.

## Add a dashboard widget

See "Dashboard widget" in `conventions/components.md`.

## Add an accent color

Entry in `ACCENTS` (`lib/theme/appearance.ts`) + an `html[data-accent="x"]` block in `app/globals.css` with `--color-brand`, `-strong`, `-light`; if reddish, also override `--color-danger` (and the dark/system variants).

## Add a navigation item

`lib/navigation/module-menu.ts` (read by `Rail`/`ModuleMenu` and `MobileMenu`, which shows only items with an `href`; label and description in Portuguese, href in English).

## Change the auth flow

Read `quality/auth-and-tokens.md` first. Touch only `lib/auth/auth-cookies.ts`, `lib/api/api-client.ts`, `proxy.ts`, the login form and the logout button; update that doc in the same change.
