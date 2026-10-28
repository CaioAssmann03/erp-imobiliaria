---
summary: Spec 041 — the new app shell (icon rail with a module menu card) and the condominium registry as one page (list, sections, side index), in the dark layout 2, driven by the existing appearance tokens.
read-when: you change the app shell, the rail, the module menu, or the condominium registry screens (list column, sections, index)
skip-if: the appearance settings themselves (mode, accent, font) → frontend/docs/norms/design-system.md; billing screens → features/039-billing-entries.md; backend rules → the backend docs index
---
# 041 — App shell and condominium registry (layout 2)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** frontend · **Frontend impact:** new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-28 | The condominium registry is **layout 2**: the dark one, a list column on the left, the condominium as one scrolling page with a section index on the right (not tabs) | the user |
| 2026-10-28 | The layout 2 look reads the **existing appearance tokens** (`canvas`, `surface`, `ink`, `brand`…): dark and orange stay the defaults, and mode, accent and font keep being changed in *Configurações* for the whole app. No second theme | the user |
| 2026-10-28 | The rail icons open a **module menu**: the two-column card (Cadastros · Relatórios), anchored to the icon | the user |
| 2026-10-28 | Menu items whose screen does not exist yet (Áreas, Ficha da unidade, Relatórios, Taxa de administração, Inadimplência, Prestação de contas) show disabled with "Em breve" | the user |
| 2026-10-28 | **Blocos** and **Sub-contas** live only inside the condominium page; **Unidades** keeps its own list across condominiums (it is reached from the menu). The old routes `/condominiums/blocks…` and `/condominiums/cost-centers…` redirect to the condominium page | the user |
| 2026-10-28 | The new shell (rail, module menu, header) wraps **every** screen; the list column and the section index exist only in the condominium registry | the user |
| 2026-10-28 | The condominium page has these sections: **Dados gerais** (identification, address), **Taxa e cobrança** (fee, billing, adjustment, apportionment — the existing form sections), **Blocos e unidades**, **Sub-contas**. Síndico, Dados bancários, Documentos, Histórico and the KPI cards of the prototype are **not built**: the backend has no data for them. They get their own specs when the data exists | agent, to be confirmed |
| 2026-10-28 | The module menu has one entry per rail module with a group of items: **Condomínios** (Cadastros: Condomínios, Unidades, Pessoas, Eventos, Áreas · Relatórios: Ficha da unidade, Relatórios, Taxa de administração, Inadimplência, Prestação de contas), **Financeiro** (Lançamentos: Contas a pagar, Extrato, Lançamento manual, Conta da imobiliária) and **Cobrança** (Cobrança: Inclusão de valores, Planos de cobrança, Documentos, Execuções, Eventos). **Painel** and **Pessoas** are plain links (a menu of one item adds a click for nothing) | agent, to be confirmed |
| 2026-10-28 | The collapsible sidebar is removed (the rail is always icons only); its cookie and CSS variant go with it | agent, to be confirmed |

## R — Requirements
The administradora's staff open one condominium and need everything about it on one page, and move between modules without a wide sidebar.
- [ ] R1 — The shell has a narrow rail with the brand, one icon per module (Painel, Condomínios, Financeiro, Cobrança, Pessoas), and *Configurações* and *Sair* at the bottom; the active module is highlighted
- [ ] R2 — Clicking Condomínios, Financeiro or Cobrança opens the module menu (a card anchored to the icon, groups in two columns, Escape and outside click close it, keyboard navigable); Painel and Pessoas navigate directly
- [ ] R3 — A menu item without a screen is disabled and says "Em breve"; the others are links
- [ ] R4 — `/condominiums` and `/condominiums/[id]` show the list column (search by name or code, the active condominium highlighted, **Novo**); `/condominiums` without a selection says to pick one
- [ ] R5 — `/condominiums/[id]` is one page with the sections of the decision above and a right index that follows the scroll and jumps to a section
- [ ] R6 — Blocos e unidades and Sub-contas on that page list only that condominium, with the same create/edit/delete as the old screens; the old routes redirect with the condominium kept
- [ ] R7 — Changing mode, accent or font in *Configurações* changes the new shell and the registry (no hard-coded color)
- [ ] R8 — On a phone the rail becomes the top bar with the existing side menu (now listing the same modules and items); the list column is a screen of its own before the page

## E — Entities
N/A — no API change, no new model.

## A — Approach
- **Tokens, not a theme.** The prototype's dark/orange palette is already the default of the design system; the new surfaces use the same classes (`bg-canvas`, `bg-surface`, `text-ink`, `bg-brand`…), so the settings keep working. The rail uses `bg-canvas`/`bg-surface-muted`; the active item uses `bg-ink text-ink-foreground` as the old sidebar did, with a brand ring for the open menu.
- **Module menu data in one file** (`lib/module-menu.ts`): modules, groups, items with `href` or `soon: true`; pure helpers `activeModule(pathname)` and `isItemActive`. The rail, the menu card and the mobile menu read it; it is the only place a menu entry is added.
- **Menu card** with Base UI `Popover` (already a dependency through the dialog): anchored to the rail button, opens to the right, focus handling and Escape for free.
- **Registry as nested layout.** `condominiums/layout.tsx` renders the list column and the page beside it; the section pages stay under it. The list uses the generated `useCondominiumsList` with a debounced search.
- **Page sections.** The existing form sections stay in the one `react-hook-form` form (one Save); the two tables render under it, outside the form, with the `condominiumId` prop that `BlocksTable` and `UnitsTable` already have (`CostCentersTable` gets the same prop). A client `SectionIndex` observes the section headings (`IntersectionObserver`) and scrolls to them.
- Rejected: tabs (the user chose the one scrolling page); a separate dark theme (it would duplicate the settings).

## S — Structure
| Path | Change |
|---|---|
| `lib/module-menu.ts` | new: modules, groups, items, `activeModule` |
| `app/(dashboard)/_components/shell/Rail.tsx`, `ModuleMenu.tsx` | new: the rail and the menu card |
| `app/(dashboard)/_components/shell/AppShell.tsx`, `MobileMenu.tsx` | rail instead of the sidebar; the mobile menu reads `module-menu.ts` |
| `Sidebar.tsx`, `NavLinks.tsx`, `nav-items.ts` | removed (`isNavItemActive` replaced by `module-menu.ts`) |
| `SettingsDialog.tsx`, `LogoutButton.tsx`, `components/Brand.tsx` | rail-sized triggers; no sidebar variants |
| `lib/auth.ts`, `lib/appearance.ts`, `app/globals.css` | sidebar cookie, attribute and variant removed |
| `app/(dashboard)/condominiums/layout.tsx`, `_components/CondominiumsList.tsx` | list column |
| `app/(dashboard)/condominiums/page.tsx` | "pick a condominium" empty state (the table moves into the list column) |
| `app/(dashboard)/condominiums/[id]/page.tsx`, `_components/SectionIndex.tsx` | the one page with sections and the index |
| `condominiums/_components/CostCentersTable.tsx` | optional `condominiumId` |
| `condominiums/blocks/**`, `condominiums/cost-centers/**` | list pages redirect to `/condominiums/[id]#…`; the create/edit forms stay and return to the condominium page |
| `condominiums/_components/CondominiumsSubNav.tsx` | removed |

## O — Operations
1. `lib/module-menu.ts` and its test.
2. Rail, menu card, shell and mobile menu; remove the sidebar and its plumbing.
3. List column and the registry layout; empty state.
4. Condominium page with sections and index; `condominiumId` on the sub-accounts table.
5. Redirects of the old routes; fix the links that pointed to them (`CondominiumRow`, dashboard pendencies, search index).
6. Docs: `frontend/docs` (folders-and-routes, design-system, product-scope), `current-state.md`.
7. Gate: `pnpm exec tsc --noEmit` · `pnpm exec eslint .` · `pnpm build`; the pure-helper tests.

## N — Norms
Tokens only, no hex; Portuguese text, English code; client-rendered pages (`frontend/docs/norms/components.md`, `norms/design-system.md`). No divider lines: sections are separated by space and surfaces.

## S — Safeguards
- **Accessibility:** the menu is a real popover (focus moves in, Escape closes, focus returns to the icon); every rail icon has an `aria-label`; the section index is a `nav` with `aria-current` on the section in view; contrast comes from the tokens in each mode.
- **Compatibility:** no URL of a screen that holds data is removed; the removed list routes redirect. Bookmarks to `/condominiums/blocks?condominium=<id>` land on the condominium page.
- **Performance:** the list column asks the API with the debounced search and a page size, never "all"; the registry keeps the list cached across navigations.
- **Failure modes:** a condominium that does not exist keeps the existing not-found page; an empty list says so.

## Test plan
| Criterion | Test |
|---|---|
| R1, R2, R3 | `frontend/tests/module-menu.test.mjs` (`activeModule`, items with `soon` have no `href`) |
| R4–R8 | none automated (rendering and interaction, checked by hand in the browser in each mode and accent, and on a phone-width screen): a gap written down |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean — N/A, no backend change
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [ ] `docs/apps/<app>.md` updated — N/A, frontend only; frontend docs updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
