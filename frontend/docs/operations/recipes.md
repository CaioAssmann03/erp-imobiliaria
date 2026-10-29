---
summary: Short recipes: regenerate client, add form field, widget, accent color, nav item, shared component, auth change.
read-when: you do a small recurring task
skip-if: a whole new resource → operations/new-resource-page.md
---
# Recipes (O — Operations)

## Regenerate the API client
Backend running → `cd frontend && pnpm generate:api`. Never edit `lib/api/generated/`. If the build then
fails on a renamed type, fix the caller (schemas, payload builders), not the generated file.
The regeneration wipes and rewrites the folder: a running `next dev` keeps a broken module graph ("Export … doesn't exist in target module", login answering 500). Stop it, delete `frontend/.next` and start it again (in Docker: `docker compose restart frontend`), then `pnpm exec next typegen` so `tsc` finds the route types.

## Add a field to an existing form
1. Backend field exists and the client is regenerated.
2. Add it to the schema (`lib/schemas/<resource>.ts`), `*_DEFAULTS`, `xxxToForm`, `xxxToPayload`.
3. Add the input to the right `*Section.tsx` (`TextField`/`SelectField`/`CheckboxField`, `mask` if needed).
4. Show it in the table row only if the list needs it.
5. Update `entities/domain-model.md` if it is a new rule or enum.

## Add a dashboard widget
New `widgets/xxx-widget.tsx` (`buildXxxWidget`) → entry in `WIDGET_IDS` (`widgets/types.ts`) and `buildWidgets`
(`widgets/index.ts`) → entry in `lib/search-index.ts`. The data comes from `/api/dashboard/` (backend change if new).

## Add an accent color
Entry in `ACCENTS` (`lib/appearance.ts`) + `html[data-accent="x"]` block in `app/globals.css` with
`--color-brand`, `-strong`, `-light`; if reddish, also override `--color-danger` (and dark/system variants).

## Add a navigation item
`lib/module-menu.ts` (read by `Rail`/`ModuleMenu` and `MobileMenu`, which shows only items with an `href`; label and description in Portuguese, href in English; an item with no `href` is shown disabled as "Em breve").

## Add a shared component
Only when two or more routes use it: `components/`; otherwise `_components/` of the route.
Follow norms/components.md (server by default, ~100 lines).

## Change the auth flow
Read safeguards/auth-and-tokens.md first. Touch only `lib/cookies.ts`, `lib/api-client.ts`, `proxy.ts`, the login
form and the logout button; update that doc in the same change.
