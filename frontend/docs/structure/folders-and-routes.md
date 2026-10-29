---
summary: Folder tree, route table and where new code goes.
read-when: you need to know where a file lives or where to put new code
skip-if: component anatomy → structure/component-patterns.md; naming → norms/language-and-naming.md
---
# Folders and routes (S — Structure)

```
app/
  layout.tsx, providers.tsx, globals.css    root: fonts, theme attrs, QueryClientProvider, Toaster
  login/                                     public (page.tsx + _components/)
  (marketing)/                               public product pages: `/` landing, features, how-it-works (forced light mode + orange accent, Lenis smooth scroll, `motion` animations; the "Agendar demonstração" target is `CONTACT_HREF` in `_components/content.ts`, still a placeholder; the hero is a centered serif title over an orange skyline drawn as horizontal scanlines on a canvas, `_components/hero/skyline-scene.ts`; public-page type, colors and buttons follow norms/marketing.md)
  (dashboard)/                               authenticated (route group, not in the URL)
    layout.tsx, dashboard/page.tsx           AppShell, dashboard home (`_components/home/DashboardHome.tsx` fetches)
    _components/shell/                       rail + module menu, mobile menu, global search, settings
    _components/home/                        widgets, lists, focus modal
    condominiums/  persons/                  one folder per resource, each with _components/
components/   ui/ (shadcn) · data-list/ · form/ · shared *.tsx
hooks/        shared hooks (debounce, list params, CEP lookup)
lib/          api/generated (never edit) · api-client · query/ · schemas/ · masks · validators · form-errors ...
proxy.ts      route protection + token refresh
docs/         REASONS documentation
```

`_`-prefixed folders are private (not routes).

`app/(dashboard)/` also holds `loading.tsx` (skeleton on a page change), `error.tsx` (an unexpected error, with retry) and `not-found.tsx`.

## Routes

| URL | File |
|---|---|
| `/` | `app/(marketing)/page.tsx` (public landing page, default route) |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` (dashboard home; login and `proxy.ts` send authenticated users here) |
| `/login` | `app/login/page.tsx` |
| `/features`, `/how-it-works` | `app/(marketing)/...` (public; content of all marketing pages lives in `_components/content.ts`) |
| `/condominiums`, `/new`, `/[id]` | `app/(dashboard)/condominiums/...` (**registry**, spec 049: `layout.tsx` wraps these three routes in `CondominiumsFrame`, the list column `CondominiumsList` (search by code or name; `?pending=<value>` from the dashboard *Pendências* filters it) beside the page; `/condominiums` is an empty state; `/[id]` is one page: the form (`dados-gerais`, `taxa-e-cobranca`), then **Blocos e unidades** and **Sub-contas** (`BlocksTable` / `CostCentersTable` with `condominiumId`) and the right index `SectionIndex`; section ids and URLs in `lib/condominium-registry.ts`) |
| `/condominiums/blocks`, `/new`, `/[id]` | `app/(dashboard)/condominiums/blocks/...` (the list **redirects** to the condominium's *Blocos e unidades* section, or to `/condominiums`; the create and edit forms stay and return to the section) |
| `/condominiums/units` | `app/(dashboard)/condominiums/units/...` (**unit workspace**, spec 050: `layout.tsx` wraps it in `UnitsFrame`: the condominium picker and the unit list `UnitsList` (server search, block/type/status filters, **Nova**) beside the page; `?condominium=<id>` picks the condominium; `?pending=<value>` (the dashboard *Pendências* shortcuts) is the one place with the all-condominiums table `UnitsTable`, no frame; `/new` redirects here) |
| `/condominiums/[id]/units/new`, `/[unitId]` | `app/(dashboard)/condominiums/[id]/units/...` (the unit page inside the same frame: `UnitHeader` (name, tags, Excluir), the sections **Dados gerais**, **Proprietário**, **Inquilino**, **Cobrança** in `UnitForm` (one Salvar, the owner and tenant sections have their own add-link form) and the right `SectionIndex`; saving stays on the page, creating opens the new unit; section ids in `lib/unit-workspace.ts`) |
| `/condominiums/[id]/blocks`, `/condominiums/[id]/units`, `/condominiums/[id]/cost-centers/new` | the first redirects to the *Blocos e unidades* section; the second to `/condominiums/units?condominium=<id>` (`?block=<id>` also filters the list); the third is the new sub-conta form with the condominium fixed |
| `/condominiums/cost-centers`, `/new`, `/[id]` | `app/(dashboard)/condominiums/cost-centers/...` ("Sub-contas": the list **redirects** to the condominium's *Sub-contas* section and the forms return there; cost center CRUD; `code` (optional, the next free one when left out; 0000 is the Conta Normal), name and active; condominium chosen on create; `?condominium=<id>` pre-filters) |
| `/persons`, `/new`, `/[id]` | `app/(dashboard)/persons/...` |
| `/finance` | redirects to `/finance/accounts-payable` (`finance/layout.tsx` renders the sub-header `FinanceSubNav`: Contas a pagar · Extrato · Lançamento manual) |
| `/finance/accounts-payable`, `/new`, `/[id]` | `app/(dashboard)/finance/accounts-payable/...` (a paid or cancelled account opens read-only; settling is a dialog, `SettleAccountPayableDialog`, cancelling is a row action) |
| `/finance/statement` | `app/(dashboard)/finance/statement/page.tsx` (`?condominium=<id>` picks the condominium; reversing is a dialog; `/condominiums/[id]/statement` redirects here) |
| `/billing` | redirects to `/billing/entries` (`billing/layout.tsx` renders the sub-header `BillingSubNav`: Inclusão de valores · Planos de cobrança · Documentos · Execuções · Eventos) |
| `/billing/entries` | `app/(dashboard)/billing/entries/...` (**Inclusão de valores**, spec 039: pick the condominium and the month, the grid of launches by unit (`BillingEntriesGrid`, summed in cents by `lib/billing-entry-payload.ts`), each column header deletes the launch (when no document used it) or ends one that repeats always; **Incluir lançamento** opens `NewEntrySheet`, a side panel with the form (event by code or list, description, rateio, recurrence, sub-conta, value, units with an optional own value for individual) and the live **Valores** preview that calls `POST /billing-entries/preview/`; tested by `tests/billing-entry.test.mjs`) |
| `/billing/plans`, `/new`, `/[id]` | `app/(dashboard)/billing/plans/...` (billing plans with a nested `items` editor: `useFieldArray`, move up/down buttons; the condominium is chosen on create and fixed on edit; the pure payload helpers are in `lib/billing-plan-payload.ts`, tested by `tests/billing-plan.test.mjs`) |
| `/billing/documents`, `/[id]` | `app/(dashboard)/billing/documents/...` (documents of the units: list with filters; the page is read-only, with items, the terms copied at issuance, **Baixar PDF** (generates it when missing) and a confirmed cancel; the status is `BillingDocumentStatusBadge`, "Vencido" derived from `is_overdue`) |
| `/billing/runs`, `/[id]` | `app/(dashboard)/billing/runs/...` (issuance runs: list, the **Emitir mês** dialog, and the run page with counts and the problems explained by `lib/billing-run-problems.ts`) |
| `/billing/events`, `/new`, `/[id]` | `app/(dashboard)/billing/events/...` (events CRUD: code, name, active and **Receita da imobiliária** (the fee event: a launch with it has no sub-conta, the form shows "Conta da imobiliária"); reached from the **Cadastros** section of the Configurações dialog and from the Cobrança tabs) |
| `/finance/entries/new` | `app/(dashboard)/finance/entries/new/page.tsx` (batch + lines with `useFieldArray`) |
| `/reports`, `/reports/delinquency`, `/reports/accountability` | `app/(dashboard)/reports/...` (spec 052: the list of reports, then **Inadimplência** (the overdue boletos with a condominium and a reference-month filter, totals, a table by condominium and a table of boletos) and **Prestação de contas** (a condominium and a month: opening balance, credits, debits and closing balance, per sub-conta, and the entries); both have **Baixar PDF** (`ReportDownloadButton`, the file comes through the `/api` proxy as a blob and `lib/download.ts` saves it; names in `lib/reports.ts`); the other two reports of the menu are "Em breve") |
| `/finance/company-account` | `app/(dashboard)/finance/company-account/...` (**Conta da imobiliária**, spec 038: the administradora's own ledger, the registration fees of the paid boletos: balance and list; `FinanceSubNav` tab) |

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
