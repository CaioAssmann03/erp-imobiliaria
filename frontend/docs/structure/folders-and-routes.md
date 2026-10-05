---
summary: Folder tree, route table and where new code goes.
read-when: you need to know where a file lives or where to put new code
skip-if: component anatomy → structure/component-patterns.md; naming → norms/language-and-naming.md
---
# Folders and routes (S — Structure)

```
app/
  layout.tsx, providers.tsx, globals.css    root: fonts, theme attrs, QueryClientProvider, Toaster
  login/                                     public (server page.tsx + _components/)
  (dashboard)/                               authenticated (route group, not in the URL)
    layout.tsx, page.tsx                     AppShell, dashboard home
    _components/shell/                       sidebar, global search, settings
    _components/home/                        widgets, lists, focus modal
    condominiums/  persons/                  one folder per resource, each with _components/
components/   ui/ (shadcn) · data-list/ · form/ · shared *.tsx
hooks/        shared hooks (debounce, list params, CEP lookup)
lib/          api/generated (never edit) · api-client · query/ · schemas/ · masks · validators · form-errors ...
proxy.ts      route protection + token refresh
docs/         REASONS documentation
```

`_`-prefixed folders are private (not routes).

## Routes

| URL | File |
|---|---|
| `/` | `app/(dashboard)/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/condominiums`, `/new`, `/[id]` (`/condominiums?pending=<value>` and `/condominiums/units?pending=<value>` open the lists filtered by a dashboard pendency, linked from *Pendências*) | `app/(dashboard)/condominiums/...` |
| `/condominiums/blocks`, `/new`, `/[id]` | `app/(dashboard)/condominiums/blocks/...` (block CRUD; `condominiums/layout.tsx` renders the sub-header `CondominiumsSubNav`: Condomínios · Blocos · Unidades) |
| `/condominiums/units`, `/new` | `app/(dashboard)/condominiums/units/...` (all units; `new` picks the condominium first via `NewUnitForm`; editing reuses `/condominiums/[id]/units/[unitId]`) |
| `/condominiums/[id]/units`, `/new`, `/[unitId]` | `app/(dashboard)/condominiums/[id]/units/...` |
| `/condominiums/[id]/blocks`, `/condominiums/[id]/units` | redirect to `/condominiums/blocks?condominium=<id>` / `/condominiums/units?condominium=<id>`: a condominium's lists are the global lists with the condominium filter applied (`?block=<id>` also pre-filters units) |
| `/condominiums/cost-centers`, `/new`, `/[id]` | `app/(dashboard)/condominiums/cost-centers/...` ("Sub-contas": cost center CRUD; name and active only, no code; condominium chosen on create; `?condominium=<id>` pre-filters) |
| `/persons`, `/new`, `/[id]` | `app/(dashboard)/persons/...` |

## Where new code goes

| It is... | Goes in |
|---|---|
| component of one route | `app/<route>/_components/` |
| component of two or more routes | `components/` |
| dashboard layout piece | `app/(dashboard)/_components/shell/` |
| hook of one route / shared hook | beside its components / `hooks/` |
| Zod schema, mask, validator, payload builder | `lib/` |
| API call | never by hand: generated hook |

A route component that gains a second user moves to `components/`.
