---
summary: What the frontend does (modules, out of scope, non-functional requirements), the stack, and the decisions behind how pages render and fetch.
read-when: you need the big picture, the reason for a decision, or to know which module exists
skip-if: entity fields → domain-model.md; folders and URLs → structure/folders.md and structure/routes.md; cache rules → conventions/data-and-cache.md
---
# Overview

ERP for a condominium administration company. Internal tool: users are staff, all authenticated with a Django user (admins only for now).

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js App Router, React 19: a client-side app, the server only delivers static shells |
| Data + cache | TanStack Query v5, fetched in the browser |
| API client | orval-generated hooks over axios |
| Forms | react-hook-form + Zod |
| UI | Tailwind v4 tokens, shadcn/ui on Base UI, lucide, sonner, recharts |
| Auth | JWT in HttpOnly cookies, held by the Next server (`quality/auth-and-tokens.md`) |
| Package manager | pnpm, pinned by `packageManager`; CI and Docker install with `--frozen-lockfile` |

This Next.js version has breaking changes: check `node_modules/next/dist/docs/` for anything not covered here.

## Decisions

| Decision | Why | Consequence |
|---|---|---|
| Pages are server shells, data is fetched by small client components | the ERP is almost entirely interactive (lists, filters, forms) | a `page.tsx` makes no API call, not even the home; the table or form (a client component) fetches with the generated hook and shows a skeleton (`conventions/components.md`) |
| No server-side data | the login has no data and the home is as interactive as the rest | no `prefetchQuery` / `HydrationBoundary`; most routes are prerendered static (`○` in `next build`), `[id]` routes render on demand with no API call |
| The backend owns filtering, search, ordering, pagination, totals and business rules | single source of truth; the client stays thin | the client sends params and presents the answer; a missing criterion or calculation is added to the API, never done in the browser (`conventions/data-and-cache.md`) |
| Generated API client | types and hooks never drift from the backend | never edit `lib/api/generated/`; regenerate |
| Form fields named like API fields | server errors land on the right field | no mapping layer |
| Tokens in cookies, refreshed by `proxy.ts` | the browser never sees a token | `quality/auth-and-tokens.md` |
| Code and routes in English, UI in Portuguese | match the backend; users read pt-BR | `conventions/code.md` |

## Rendering

- `page.tsx` / `layout.tsx` are server components but fetch nothing. `params` is a Promise (`await` it); `searchParams` is read on the client with `useSearchParams` (so list routes stay static), inside a `Suspense`.
- The root layout and `AppShell` read no cookie: appearance is applied to `<html>` by an inline script before the first paint (`conventions/design-system.md`), so the HTML is the same for everyone. The rail's expanded state is `localStorage`, never a cookie.
- `proxy.ts` runs before every request: no token → `/login?next=`; token expiring (< 30 s) → refresh and forward the new cookies; refresh failure → `/login`.
- Every page exports `metadata` (Portuguese title; the root template is `"%s · METRI"`). `loading.tsx` is the skeleton on a page change; `error.tsx` / `not-found.tsx` handle failures (`conventions/data-and-cache.md`, detail pages).

## Modules today

| Module | URL | Notes |
|---|---|---|
| Login | `/login` | username/password → JWT |
| Dashboard | `/dashboard` | cards per person (order/visibility in `localStorage`, edit mode by drag or arrow keys), a focus view per card (`?focus=`), global search (⌘K). Cards: this month's issuance, delinquency, accounts payable, pending items, issued × received chart, fixed revenue, upcoming adjustments |
| Condominiums | `/condominiums` | registry: identification, address, fee contract, billing rules, late-interest rates, apportionment criteria, Google map under the address (needs `GOOGLE_MAPS_EMBED_KEY`, otherwise a link) |
| Blocks, Units, Sub-contas | `/condominiums/...` | sub-screens of a condominium; a unit has owners/tenants and a fraction per apportionment criterion; sub-contas are picked from the administradora's catalog |
| Persons | `/condominiums/persons` | individuals (CPF) and legal entities (CNPJ) |
| Events | `/condominiums/events` | event code + name used in launches |
| Billing | `/billing/*` | Inclusão de valores (launches), Planos, Boleto extra, Documentos (issued boletos), Execuções (monthly issuance runs, **Emitir mês**) |
| Finance | `/finance/*` | Contas a pagar (with *baixa*), Extrato (current account, reversal), Lançamento manual, Conta da imobiliária, Catálogo de sub-contas |
| Reports | `/reports` | Inadimplência and Prestação de contas, both with PDF; two more are "Em breve" |
| Help assistant | header button | `features/assistant.md` |
| Public site | `/`, `/features`, `/how-it-works`, `/contato` | `features/marketing.md` |

Out of scope for now: suppliers, bank accounts and entry-template screens (Django Admin), payment receipts, rentals, sales, person login.

**Excluir archives** (backend spec 062): the UI keeps the word *Excluir*, but for a condominium, block, unit, person, supplier and sub-conta the record leaves every list, search and report and stays in the database. A refusal comes back as a coded 400 with a Portuguese message in `lib/errors/error-messages.ts`. Restoring and anonymizing a person are for the superuser, with no screen yet.

## Non-functional requirements

| Area | Requirement |
|---|---|
| Language | code in English, UI text in Portuguese (pt-BR), docs in English |
| Themes | dark by default; light/system; accent color and font apply to the whole shell through the tokens |
| Responsive | usable on a phone: list and record are separate screens, the right menu becomes a sticky row of buttons below `xl`, fields use 16 px text under `lg` (iOS zoom), menu rows are 44 px |
| Performance | instant shell with skeletons; server-side pagination, search and filters (`quality/performance.md`) |
| Security | tokens only in HttpOnly cookies, no PII in logs or URLs, the backend authorizes everything (`quality/`) |
| Accessibility | keyboard operable, labeled fields, visible focus, contrast in both modes |
| Quality gate | `tsc`, `eslint`, `pnpm test`, `next build` clean (`guides/recipes.md`) |
