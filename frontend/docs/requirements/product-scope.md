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
| Dashboard | `/dashboard` | a sentence with the registry totals; row 1 the money in and out as three cards: this month's issuance in reais (issued, received, open, how many active condominiums already have a boleto, runs with problems; the focus view lists the ones without), delinquency (overdue boletos: total, count, the 3 condominiums that owe most; the focus view charts all of them) and accounts payable (the overdue value, then today, next 7 days and this month; the oldest open accounts only in the focus view); row 2 an issued × received area chart of the last 6 months (12 in the focus view) beside the pending items (the adjustment and lease rows only in the focus view); row 3 the upcoming adjustments list. The adjustments chart, units with a responsible and fixed revenue only in the focus view and the search; global search (⌘K) |
| Condominiums | `/condominiums` | the registry (spec 049): the list of condominiums on the left and, for the one open, a single page with its sections and a side index; CRUD: identification, address, fee contract, billing rules (due day, due month and competence with an example, late fee with a first-days tier, interest calculation and the interest rates by start date (on a new condominium they are collected in the form and posted after the condominium, then the billing rules, in separate requests), boleto options, discount), adjustment; the totals of the ideal fractions; a Google map under the address (needs `GOOGLE_MAPS_EMBED_KEY`, otherwise a link) |
| Units | `/condominiums/units` | the unit workspace (spec 050): pick a condominium, its units on the left, the open unit as one page (Dados gerais, Proprietário, Inquilino, Cobrança); `?pending=` (the dashboard *Pendências* shortcuts) opens the same workspace with the left list already filtered by that pendency across all condominiums; CRUD per condominium, with a fraction in each of the condominium's apportionment criteria (managed on the condominium page); owners/tenants linked to each unit |
| Persons | `/condominiums/persons` (and the people of one condominium at `/condominiums/[id]/persons`; the unit menu has *Cadastros → Pessoas*, which opens the persons filtered by that unit) | inside Condomínios (Cadastros), in the registry's 3-column look: the list on the left (search, filters, **+**), the open person in the middle, a section index on the right; CRUD of individuals (CPF) and legal entities (CNPJ) |
| Finance · Accounts payable | `/finance/accounts-payable` | list with filters, register/edit, settle ("baixa", which posts the debit in the condominium's statement) and cancel |
| Finance · Statement | `/finance/statement/[condominium]` | current account of a condominium: balance and balance by cost center, entries (newest first) with filters (period, reference month, kind), reversal |
| Billing · Entries | `/billing/entries` | **Inclusão de valores**: the values launched for a condominium's boletos besides the plan, by month: 3-column screen: the month's launches in the list, the grid by unit as the empty screen, a new launch form with live preview, delete or end a launch (spec 039) |
| Events | `/condominiums/events` | the events (code + name) that fill a launch's description, in the registry's 3-column look (list on the left, the open event in the middle, a section index on the right); in the module menu only under Condomínios → Cadastros → Eventos (no longer in Cobrança) |
| Billing · Plans | `/billing/plans` | list (search, condominium and status filters), create and edit a billing plan with its items (kind-dependent fields, ordered with move buttons), delete; the issuance fields live in the condominium form (`issuance_day`, `exempts_manager_unit`) and the unit form (`billing_recipient`) |
| Billing · Documents | `/billing/documents` | the issued boletos per unit and month: list (search, condominium, status, reference month, overdue), the document page with items, draft PDF download and cancel |
| Billing · Runs | `/billing/runs` | the monthly issuance runs: counts per run, **Emitir mês** (issue a condominium's month now), and each run's problems with a Portuguese sentence and a link to fix them |
| Reports | `/reports` (lives in the Condomínios menu, so that module stays selected in the rail; a plain list of names on the left, the open report in the middle) | **Inadimplência** (overdue boletos by condominium, with totals and PDF) and **Prestação de contas** (a condominium's month in the current account, by sub-conta, with PDF); Ficha da unidade and Taxa de administração are "Em breve" (spec 052) |
| Finance · Manual entry | `/finance/entries` | the list of batches; a new batch with several entries, possibly of several condominiums, posted all or none; an open batch shows its entries and reverses them |
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

**Excluir archives (backend spec 062):** the UI keeps the word *Excluir*, but for a condominium, block, unit, person, supplier and sub-conta it archives: the record leaves every list, search and report and stays in the database. A refusal (an active condominium, a unit that still has a current owner…) comes back as a coded 400 with a Portuguese message in `lib/error-messages.ts`. Restoring and the LGPD anonymization of a person are for the superuser (Admin / API), with no screen yet.
