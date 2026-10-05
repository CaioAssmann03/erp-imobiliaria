---
summary: Frontend modules, out-of-scope items and non-functional requirements.
read-when: you need to know what the app must do or for whom
skip-if: entity fields → entities/domain-model.md; stack → approach/architecture.md
---
# Product scope (R — Requirements)

ERP for a condominium administration company (EVE Administradora). Internal tool; users are staff, all
authenticated with a Django user (admins only for now).

## Modules in the frontend today

| Module | URL | What it does |
|---|---|---|
| Login | `/login` | username/password → JWT |
| Dashboard | `/` | summary strip (condominiums, units, persons), accounts payable by due window, pending items, adjustments, responsibles, fixed revenue, leases; global search (⌘K) |
| Condominiums | `/condominiums` | CRUD: identification, address, fee contract, billing rules, adjustment |
| Units | `/condominiums/[id]/units` | CRUD per condominium; owners/tenants linked to each unit |
| Persons | `/persons` | CRUD of individuals (CPF) and legal entities (CNPJ) |

Out of scope for now: finance, billing, rentals, sales (backend placeholders only), person login (only admins log in).

## Non-functional requirements

| Area | Requirement |
|---|---|
| Language | code in English, UI text in Portuguese (pt-BR); docs in English |
| Themes | dark default; light/system; selectable accent color and font |
| Responsive | usable on mobile width; secondary columns hidden below `md` |
| Performance | first paint with data (server prefetch); server-side pagination/search/filters |
| Security | tokens only in cookies, no PII in logs/URLs, backend authorizes everything |
| Accessibility | keyboard operable, labeled fields, visible focus, contrast in both modes |
| Quality gate | `tsc`, `eslint`, `next build` clean before finishing |
