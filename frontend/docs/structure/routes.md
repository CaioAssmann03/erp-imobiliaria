---
summary: Route table: URL → folder, the frame that wraps it, and the behaviors of each screen that code alone does not make obvious.
read-when: you need to know which file serves a URL, or how a screen behaves (redirects, URL params, empty states)
skip-if: how a frame, list, header, menu and back button work → structure/registry-layout.md; folder tree → structure/folders.md
---
# Routes

All ERP routes live under `app/(dashboard)/`. Every registry route below is in the 3-column layout (`structure/registry-layout.md`): `layout.tsx` draws the frame, `page.tsx` is the empty screen, `new/page.tsx` and `[id]/page.tsx` render only the content. A route segment that is not an id is **reserved** in `/condominiums/<segment>` (`new`, `units`, `blocks`, `cost-centers`, `persons`, `events`).

## Public

| URL | Folder | Notes |
|---|---|---|
| `/` | `(marketing)/page.tsx` | landing, the default route |
| `/features`, `/how-it-works` | `(marketing)/...` | text in `_components/content.ts` |
| `/features/[slug]` | `(marketing)/features/[slug]/` | one landing per module; slugs in `MODULE_SLUGS` (`lib/site/public-pages.ts`) |
| `/contato` | `(marketing)/contato/` | **visual only**: the form does not send and the WhatsApp card has no link yet; target of every "Agendar demonstração" (`CONTACT_HREF`) |
| `/login` | `login/` | |
| `/robots.txt`, `/sitemap.xml`, `/opengraph-image` | `app/robots.ts`, `sitemap.ts`, `opengraph-image.tsx` | outside the `proxy.ts` matcher |

Details of the public pages: `features/marketing.md`.

## Dashboard

| URL | Notes |
|---|---|
| `/dashboard` | home; login and `proxy.ts` send authenticated users here. `?focus=<card>` opens a card's focus view; each card row that opens a module carries its filter in the URL (`/reports/delinquency?condominium=`, `/finance/accounts-payable?due=`) |

## Condomínios

| URL | Frame | Notes |
|---|---|---|
| `/condominiums`, `/new`, `/[id]` | `CondominiumsFrame` (`condominiums/layout.tsx`) | files in the `(condominium)/` route group. `/condominiums` is an empty state; `/[id]` is only the condominium's own form (`dados-gerais`, `taxa-e-cobranca`); `?pending=` (dashboard *Pendências*) opens the list with the pending filter set. Picking another condominium keeps the open screen (Blocos, Unidades, Sub-contas or the data page). Section ids and URLs: `lib/condominiums/condominium-registry.ts` |
| `/condominiums/[id]/blocks`, `/units`, `/persons`, `/cost-centers` | `CondominiumsFrame` | the condominium's sub-screens (*Blocos*, *Unidades*, *Pessoas*, *Sub-contas*), each a `RegistrySubList` in the middle. *Pessoas* are the people with a current owner/tenant link to any unit (`condominium-people?condominium=`) |
| `/condominiums/[id]/cost-centers/new`, `/[id]/units/new`, `/[id]/blocks/new` | the module's frame | create inside a chosen condominium |
| `/condominiums/blocks`, `/new`, `/[id]` | `BlocksFrame` | the list **redirects** to the condominium's *Blocos* screen (or `/condominiums`); forms stay and return to it. `/blocks/new` with no condominium asks for it (`NewBlockChooseCondominium`). `/blocks/[id]/units` is the block's units as a sub-screen |
| `/condominiums/units`, `/new` | `UnitsFrame` | `?condominium=` picks the condominium; `?pending=` lists the units with that pendency across **all** condominiums and keeps the filter while you open them one by one; `?block=` keeps the list on a block. `/new` without a condominium asks for it |
| `/condominiums/[id]/units/new`, `/[unitId]` | `UnitsFrame` | the unit form: *Dados gerais*, *Proprietário*, *Inquilino*, *Cobrança*; one Salvar. On a **new** unit the owner/tenant links are collected and posted after the unit (`PendingLink`); a refused link does not undo the unit. `/[unitId]/persons` is the unit's people sub-screen |
| `/condominiums/cost-centers`, `/new`, `/[id]` | `CostCentersFrame` (in a `Suspense`) | a sub-conta is **chosen from the catalog** and only `active` changes (spec 053). `?condominium=` pre-filters; `/new` without a condominium asks for it |
| `/condominiums/persons`, `/new`, `/[id]` | `PersonsFrame` | list scope from `?condominium=` / `?unit=` (switches to `condominium-people`); `?from=` drives the back button. Persons have no module of their own in the module menu |
| `/condominiums/events`, `/new`, `/[id]` | `BillingEventsFrame` | event CRUD: code, name, active, **Receita da imobiliária**. An event used by launches is refused on delete |

## Cobrança

`/billing` redirects to `/billing/entries`; there is no `billing/layout.tsx` and no tabs: the module menu is the way between screens. Scope lives in the URL: `?condominium=` (and `&month=` / `&reference_month=` as `2026-10-01`), through `lib/billing/*-workspace.ts`. Each frame is in a `Suspense` because it reads the URL.

| URL | Frame | Notes |
|---|---|---|
| `/billing/entries`, `/new`, `/[id]` | `BillingEntriesFrame` | **Inclusão de valores** (spec 039). Empty screen = the month's grid by unit, full width, no menu. `new` has a live preview (`POST /billing-entries/preview/`). `[id]` is read-only with **Encerrar** (repeats always) and **Excluir** (no document used it) |
| `/billing/extra`, `/new`, `/[id]` | `ExtraBillingFrame` | **Boleto extra** (spec 054). Units by rule: all / by block / specific (server search); all and by-block fetch the active units page by page. Posts `POST /billing-documents/extra/` and shows issued and skipped units in the same place. `[id]` is the document view |
| `/billing/plans`, `/new`, `/[id]` | `BillingPlansFrame` | plan with nested `items` (`useFieldArray`, move up/down); the condominium is fixed after create; **Excluir** returns to the empty screen |
| `/billing/documents`, `/[id]` | `BillingDocumentsFrame` | the condominium is a **required** scope (nothing lists until chosen), then the reference month; no **+** (a document comes from the issuance or Boleto extra); `[id]` is the summary, actions, *Boleto*, *Itens*, *Condições na emissão* |
| `/billing/runs`, `/[id]` | `BillingRunsFrame` | required condominium scope; the **+** opens **Emitir mês** filled with the list's scope; `[id]` shows counts and *Problemas*, explained by `lib/billing/billing-run-problems.ts` |

## Financeiro

`/finance` redirects to `/finance/accounts-payable`; there is no `finance/layout.tsx` and no tabs.

| URL | Frame | Notes |
|---|---|---|
| `/finance/accounts-payable`, `/new`, `/[id]` | `AccountsPayableFrame` | action bar: **Cancelar conta**, **Dar baixa** (dialog), **Salvar**. A paid or cancelled account opens read-only |
| `/finance/statement`, `/[id]` | `StatementFrame` | one statement per condominium; `?condominium=<id>` redirects to `/finance/statement/<id>`; reversing is a dialog |
| `/finance/entries`, `/new`, `/[id]` | `EntriesFrame` | **Lançamento manual**: a batch of lines posted all or none; an open batch is read-only (10 per page) with the reversal dialog |
| `/finance/company-account`, `/[id]` | `CompanyAccountFrame` | **Conta da imobiliária** (spec 038): the empty screen is the balance; entries are read-only |
| `/finance/cost-center-catalog`, `/new`, `/[id]` | `CatalogFrame` | **Catálogo de sub-contas** (spec 053). **Excluir** is refused while a condominium uses it |

## Relatórios

| URL | Frame | Notes |
|---|---|---|
| `/reports`, `/reports/delinquency`, `/reports/accountability`, `/reports/administration-fee`, `/reports/unit-sheet` | `ReportsFrame` (`lib/reports/report-catalog.ts`) | 2 columns (no right menu). `/reports` is an overview; **Inadimplência** has a condominium and month scope, 10 boletos per page (`?page=`, spec 057); **Prestação de contas** is one condominium and month; **Taxa de administração** (spec 070) is one month: a row per active condominium with the contract rule, the month's base (credits or debits of the statement), the fee due and whether ISS is charged, a contract not started or missing listed and not counted; **Ficha da unidade** (spec 071) is a condominium, a unit and a period (default 12 months): data and people, the boletos with their totals and the unit's entries, opened already filled from the *Ficha da unidade* link of the unit page (`unitSheetUrl`); all have **Baixar PDF** (a blob through the `/api` proxy, saved by `lib/reports/download.ts`) |
