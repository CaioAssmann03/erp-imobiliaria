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
| Finance · Accounts payable | `/finance/accounts-payable` | list with filters, register/edit, settle ("baixa", which posts the debit in the condominium's statement) and cancel |
| Finance · Statement | `/finance/statement` | current account of a condominium: balance and balance by cost center, entries (newest first) with filters (period, reference month, kind), reversal |
| Finance · Manual entry | `/finance/entries/new` | one batch with several entries, possibly of several condominiums, posted all or none |

Out of scope for now: suppliers, bank accounts and entry templates screens (registered in the Django Admin), payment receipts, billing, rentals, sales (backend placeholders only), person login (only admins log in).

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
