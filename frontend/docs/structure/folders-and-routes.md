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
  (marketing)/                               public product pages: `/` landing, features, how-it-works (light theme + orange accent, Lenis smooth scroll, `motion` animations; the "Agendar demonstração" target is `CONTACT_HREF` in `_components/content.ts`, still a placeholder; the hero is a centered large title over an orange skyline drawn as horizontal scanlines on a canvas, `_components/hero/skyline-scene.ts`; public-page type, colors and buttons follow norms/marketing.md)
  (dashboard)/                               authenticated (route group, not in the URL)
    layout.tsx, dashboard/page.tsx           AppShell, dashboard home (`_components/home/DashboardHome.tsx` fetches)
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
| `/` | `app/(marketing)/page.tsx` (public landing page, default route) |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` (dashboard home; login and `proxy.ts` send authenticated users here) |
| `/login` | `app/login/page.tsx` (under the home's `SiteHeader` via `app/login/layout.tsx`; left, a narrow column centred on the form: a discreet "Voltar ao início" link, a short "Entrar" title, one line of support and the flat form (square inputs, black button, no card or hairlines), then "Criar conta"; right, from `lg`: one small building of different volumes (podium, residential slab, end tower; `login/_components/skyscraper/scene.ts`), drawn as orange particles, small, beside the form and fully in view, both centred on the screen; the mouse lights the windows (read on `window`, because the page's `<main>` covers the building). Mobile shows only the left side. the top-left "Voltar ao site" goes to `/` (no logo or name for now); "Criar conta" links to `CONTACT_HREF` (the `#contato` anchor on the footer) because the API has no sign-up yet: when it does, point it at a `/register` page) |
| `/features`, `/how-it-works` | `app/(marketing)/...` (public; content of all marketing pages lives in `_components/content.ts`) |
| `/condominiums`, `/new`, `/[id]` | `app/(dashboard)/condominiums/...`: **three columns**. `condominiums/layout.tsx` renders `CondominiumsWorkspace` (`_components/workspace/`): the condominium list on the left (`CondominiumsPane`: server-side search, "Mostrar mais", `?pending=<value>` from the dashboard *Pendências* filters it) stays mounted while you move between condominiums; `/condominiums` itself only asks to pick one (on mobile it shows just the list, the other routes just the content). `condominiums/[id]/layout.tsx` renders `CondominiumHeader` (just the name) and `CondominiumSectionNav` (plain text links in two groups, *Cadastro* (the form sections) and *Gestão* (Unidades, Blocos, Sub-contas, Extrato), a brand mark on the current one; a column on the right from `xl` with a button that collapses it to just that button, remembered in `localStorage` as `condominium-nav-collapsed`; a row under the name below `xl`), so changing section swaps only the content. Sections: the registration form (`[id]/page.tsx`) shows **one section at a time** (Identificação · Endereço · Taxa de administração · Cobrança · Reajuste · Rateio, in `lib/condominium-sections.ts`), chosen by `?section=<id>`; the nav switches it with `history.pushState` (no server request, the form stays mounted, so unsaved edits survive the switch), every panel is rendered with `data-section` and `hidden`, saving with an error jumps to the first section that has one, and the error summary opens a closed section before focusing (`components/form/reveal-section.ts`); the delete button is in the form footer. Then *Unidades* · *Blocos* · *Sub-contas* · *Extrato* (link to `/finance/statement?condominium=`). The lists drop the status badge column: an inactive row says "Inativa" in muted text |
| `/condominiums/[id]/blocks`, `/new`, `/[blockId]` | block CRUD of one condominium (a section). `/condominiums/blocks` (no id) redirects to `/condominiums`, with `?condominium=<id>` to that section |
| `/condominiums/units`, `/new` | `app/(dashboard)/condominiums/units/...` (all units of every condominium, kept for the dashboard pendencies `?pending=` and the global search; `new` picks the condominium first via `NewUnitForm`; editing reuses `/condominiums/[id]/units/[unitId]`) |
| `/condominiums/[id]/units`, `/new`, `/[unitId]` | `app/(dashboard)/condominiums/[id]/units/...` (the *Unidades* section: `UnitsTable` scoped by `condominiumId`; `?block=<id>` pre-filters) |
| `/condominiums/[id]/cost-centers`, `/new`, `/[costCenterId]` | the *Sub-contas* section: cost center CRUD of one condominium (`code` optional, the next free one when left out; 0000 is the Conta Normal; name and active). `/condominiums/cost-centers` redirects like blocks; `/condominiums/cost-centers/[id]` (a global search result) looks the cost center up and redirects into its condominium (`CostCenterRedirect`) |
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
