---
summary: Folder tree and where new code goes.
read-when: you need to know where a file lives or where to put new code
skip-if: URLs and which file serves them → structure/routes.md; component rules → conventions/components.md; naming → conventions/code.md
---
# Folders

```
app/
  layout.tsx, providers.tsx, globals.css   root: fonts, theme attrs, QueryClientProvider, Toaster
  login/                                    public
  robots.ts, sitemap.ts, opengraph-image.tsx   SEO of the public site
  api/[...path]/route.ts                    the proxy that holds the token (quality/auth-and-tokens.md)
  (marketing)/                              public product pages (features/marketing.md)
  (dashboard)/                              authenticated (route group, not in the URL)
    layout.tsx, loading.tsx, error.tsx, not-found.tsx
    dashboard/page.tsx                      home
    _components/shell/                      AppShell, rail, module menu, global search, settings dialog
    _components/home/                       dashboard cards: card/ bodies/ charts/ layout/ shared/ widgets/ (+ widgets/focus/)
    condominiums/ billing/ finance/ reports/   one folder per module, each with _components/
components/   ui/ (shadcn) · charts/ · data-list/ · form/ (+ fields/) · dates/ · filters/ · persons/ · layout/ (Registry*, PageHeader, BackLink, SectionIndex)
              · errors/ · brand/ · assistant/ · a few loose single-purpose buttons
hooks/        shared hooks (debounce, list params, URL scope, record form/submit, CEP lookup)
lib/          one folder per concern; no loose files except utils.ts (the shadcn alias)
  api/ (generated: never edit · mutator · api-client · api-path · pagination)   query/   schemas/ (Zod, per resource)
  auth/   errors/ (messages, details, screens, form-errors, toast)   theme/ (appearance, mode, ui.ts class strings)
  format/ (format, masks, validators, calendar)   navigation/ (module-menu, search-index, back-target, registry-frame, url-scope)
  site/ (public-site facts: site.ts, public-pages.ts, page-metadata.ts)
  billing/ condominiums/ finance/ persons/ reports/   per domain: *-workspace (URL + frame state), payload builders, rules
proxy.ts      route protection + token refresh
tests/        node:test for pure helpers (*.test.mjs)
docs/         this documentation
```

`_`-prefixed folders are private (not routes). A **new folder under `app/` is not seen by the Docker dev server** (bind mount): `docker compose restart frontend` after creating one.

## Where new code goes

| It is... | Goes in |
|---|---|
| component of one route | `app/<route>/_components/` |
| component of two or more routes | `components/<group>/` |
| dashboard shell piece / home card | `app/(dashboard)/_components/shell/` / `home/` |
| hook of one route / shared hook | beside its components / `hooks/` |
| Zod schema, `xxxToForm`, `xxxToPayload` | `lib/schemas/` |
| mask, validator, formatter | `lib/format/` |
| URL / frame-state helpers, payload builders, rules of one domain | `lib/<domain>/` |
| API call | never by hand: the generated hook |

A route component that gains a second user moves to `components/`.

## Error screens

`app/(dashboard)/error.tsx`, `not-found.tsx`, the root `app/not-found.tsx` and `app/global-error.tsx` render `components/errors/ErrorScreen.tsx`. Copy, hint and actions per HTTP code live in `lib/errors/error-screens.ts` (any other 400–599 gets a generic screen of its range; 429 and 503 hold *Tentar de novo* behind a countdown; 5xx screens show the Next `digest`). They appear only for real errors, chosen by `errorScreenCodeOf`; a 401 goes to the login, and a failed save (409, 413, 415, 422, 423…) stays a toast and field errors so the form is not lost. Tested by `tests/error-screens.test.mjs`.
