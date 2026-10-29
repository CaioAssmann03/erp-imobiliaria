---
summary: Frontend modules, out-of-scope items and non-functional requirements.
read-when: you need to know what the app must do or for whom
skip-if: entity fields → entities/domain-model.md; stack → approach/architecture.md
---
# Product scope (R — Requirements)

ERP for a condominium administration company. Internal tool; users are staff, all
authenticated with a Django user (admins only for now).

## Modules in the frontend today

| Module | URL | What it does |
|---|---|---|
| Login | `/login` | username/password → JWT |
| Dashboard | `/dashboard` | summary strip (condominiums, units, persons), accounts payable by due window, pending items, adjustments, responsibles, fixed revenue, leases; global search (⌘K) |
| Condominiums | `/condominiums` | the registry (spec 049): the list of condominiums on the left and, for the one open, a single page with its sections and a side index; CRUD: identification, address, fee contract, billing rules (due day, due month and competence with an example, late fee with a first-days tier, interest calculation and the interest rates by start date, boleto options, discount), adjustment; the totals of the ideal fractions; a Google map under the address (needs `GOOGLE_MAPS_EMBED_KEY`, otherwise a link) |
| Units | `/condominiums/units` | the unit workspace (spec 050): pick a condominium, its units on the left, the open unit as one page (Dados gerais, Proprietário, Inquilino, Cobrança); the table of all condominiums only for dashboard pendencies; CRUD per condominium, with a fraction in each of the condominium's apportionment criteria (managed on the condominium page); owners/tenants linked to each unit |
| Persons | `/persons` | CRUD of individuals (CPF) and legal entities (CNPJ) |
| Finance · Accounts payable | `/finance/accounts-payable` | list with filters, register/edit, settle ("baixa", which posts the debit in the condominium's statement) and cancel |
| Finance · Statement | `/finance/statement` | current account of a condominium: balance and balance by cost center, entries (newest first) with filters (period, reference month, kind), reversal |
| Billing · Entries | `/billing/entries` | **Inclusão de valores**: the values launched for a condominium's boletos besides the plan, by month: grid by unit, new launch panel with live preview, delete or end a launch (spec 039) |
| Billing · Events | `/billing/events` | the events (code + name) that fill a launch's description; in the module menu (Condomínios → Cadastros → Eventos) |
| Billing · Plans | `/billing/plans` | list (search, condominium and status filters), create and edit a billing plan with its items (kind-dependent fields, ordered with move buttons), delete; the issuance fields live in the condominium form (`issuance_day`, `exempts_manager_unit`) and the unit form (`billing_recipient`) |
| Billing · Documents | `/billing/documents` | the issued boletos per unit and month: list (search, condominium, status, reference month, overdue), the document page with items, draft PDF download and cancel |
| Billing · Runs | `/billing/runs` | the monthly issuance runs: counts per run, **Emitir mês** (issue a condominium's month now), and each run's problems with a Portuguese sentence and a link to fix them |
| Reports | `/reports` | **Inadimplência** (overdue boletos by condominium, with totals and PDF) and **Prestação de contas** (a condominium's month in the current account, by sub-conta, with PDF); Ficha da unidade and Taxa de administração are "Em breve" (spec 052) |
| Finance · Manual entry | `/finance/entries/new` | one batch with several entries, possibly of several condominiums, posted all or none |
| Finance · Company account | `/finance/company-account` | **Conta da imobiliária**: the administradora's own ledger (the registration fees of the paid boletos): balance and list (spec 038) |

Out of scope for now: suppliers, bank accounts and entry templates screens (registered in the Django Admin), payment receipts, billing, rentals, sales (backend placeholders only), person login (only admins log in).

## Non-functional requirements

| Area | Requirement |
|---|---|
| Language | code in English, UI text in Portuguese (pt-BR); docs in English |
| Themes | dark default; light/system; selectable accent color and font, applied to the whole shell (rail, module menu, registry) through the tokens |
| Responsive | usable on mobile width; secondary columns hidden below `md`. On a phone: the side menu (`MobileMenu`) has modules collapsed in rows of 44 px and only the screens that exist; the right-hand `SectionIndex` becomes a sticky row of buttons under the header (below `xl`) so the sections and the Blocos/Unidades/Sub-contas screens stay reachable; fields use 16 px text under `lg` (iOS zoom, `data-app-shell` in `globals.css`) |
| Performance | instant shell with skeletons, static shells, data fetched on the client; server-side pagination/search/filters |
| Security | tokens only in cookies, no PII in logs/URLs, backend authorizes everything |
| Accessibility | keyboard operable, labeled fields, visible focus, contrast in both modes |
| Quality gate | `tsc`, `eslint`, `next build` clean before finishing |
