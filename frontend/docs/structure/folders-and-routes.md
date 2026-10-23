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
  (dashboard)/                               authenticated (route group, not in the URL)
    layout.tsx, page.tsx                     AppShell, dashboard home (`_components/home/DashboardHome.tsx` fetches)
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

`app/(dashboard)/` also holds `loading.tsx` (skeleton on a page change), `error.tsx` (an unexpected error, with retry) and `not-found.tsx`.

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
| `/finance` | redirects to `/finance/accounts-payable` (`finance/layout.tsx` renders the sub-header `FinanceSubNav`: Contas a pagar · Extrato · Lançamento manual) |
| `/finance/accounts-payable`, `/new`, `/[id]` | `app/(dashboard)/finance/accounts-payable/...` (a paid or cancelled account opens read-only; settling is a dialog, `SettleAccountPayableDialog`, cancelling is a row action) |
| `/finance/statement` | `app/(dashboard)/finance/statement/page.tsx` (`?condominium=<id>` picks the condominium; reversing is a dialog; `/condominiums/[id]/statement` redirects here) |
| `/billing` | redirects to `/billing/plans` (`billing/layout.tsx` renders the sub-header `BillingSubNav`: Planos de cobrança) |
| `/billing/plans`, `/new`, `/[id]` | `app/(dashboard)/billing/plans/...` (billing plans with a nested `items` editor: `useFieldArray`, move up/down buttons; the condominium is chosen on create and fixed on edit; the pure payload helpers are in `lib/billing-plan-payload.ts`, tested by `tests/billing-plan.test.mjs`) |
| `/billing/documents`, `/[id]` | `app/(dashboard)/billing/documents/...` (documents of the units: list with filters; the page is read-only, with items, the terms copied at issuance, **Baixar PDF** (generates it when missing) and a confirmed cancel; the status is `BillingDocumentStatusBadge`, "Vencido" derived from `is_overdue`) |
| `/billing/runs`, `/[id]` | `app/(dashboard)/billing/runs/...` (issuance runs: list, the **Emitir mês** dialog, and the run page with counts and the problems explained by `lib/billing-run-problems.ts`) |
| `/finance/entries/new` | `app/(dashboard)/finance/entries/new/page.tsx` (batch + lines with `useFieldArray`) |

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
