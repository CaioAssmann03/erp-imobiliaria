---
summary: Spec 050 — the unit registry as a workspace (pick a condominium, its units on the left, the open unit as one page with a section index), replacing the all-units table; the table stays only for dashboard pendencies.
read-when: you change the unit screens (list column, unit page, sections, new unit) or the links that open a unit
skip-if: the shell, rail and condominium registry → features/049-app-shell-and-condominium-registry.md; the unit fields and the person links → frontend/docs/entities/domain-model.md; backend rules → the backend docs index
---
# 050 — Unit workspace

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** frontend · **Frontend impact:** new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | The unit registry stops listing every unit: the user **picks a condominium**, sees **its units** in a column and opens one; a **Nova** button creates a unit in that condominium. Layout from the reference prints (condominium picker + unit list on the left, the unit's sections in the middle, a section index on the right), in the system's own style (the tokens of spec 049) | the user |
| 2026-10-29 | Only the sections that have data: **Dados gerais** (identification and fractions), **Proprietário**, **Inquilino**, **Cobrança** (who receives the boleto, billing blocked, the meters' fixed values). The prints' other sections (Dados jurídicos, Configurações, Histórico de operações, Moradores adicionais, Envio de boleto, Cliente online, Endereços, Débito em conta, Observação) wait for backend data, each with its own spec | the user |
| 2026-10-29 | Editing is as in the condominium page: the fields are always editable with one **Salvar**; owners and tenants keep the add/remove link form | the user |
| 2026-10-29 | The cross-condominium unit table stays **only for pendencies**: `/condominiums/units?pending=<value>` (the dashboard shortcuts) shows it; without `pending` the screen asks for a condominium | the user |
| 2026-10-29 | URLs: `/condominiums/units?condominium=<id>` (picked, no unit open), `/condominiums/[id]/units/[unitId]` (a unit), `/condominiums/[id]/units/new` (new). `/condominiums/units/new` redirects to `/condominiums/units`; `/condominiums/[id]/units` redirects to `/condominiums/units?condominium=<id>` (`?block=<id>` kept as a list filter) | agent, to be confirmed |
| 2026-10-29 | Saving an existing unit **stays on the unit page** (toast); creating one opens the new unit; **Excluir** moves from the old table row to the unit page header | agent, to be confirmed |
| 2026-10-29 | The unit list column loads the first 100 units of the condominium with a server-side search (`query`) and the block/status/type filters; beyond 100 it says to refine the search | agent, to be confirmed |

## R — Requirements
- [x] R1 — `/condominiums/units` without `pending` shows the condominium picker (code and name) and, once picked, that condominium's units; nothing from other condominiums appears
- [x] R2 — The unit list shows `Tipo + name` (e.g. "Apartamento 101"), a **Síndico** tag for the manager unit, "Inativa" when inactive, searches on the server, filters by block, type and status, and has **Nova**
- [x] R3 — Opening a unit shows its page with a header (name, tags, Excluir) and the sections Dados gerais, Proprietário, Inquilino, Cobrança, and a right index that follows the scroll
- [x] R4 — The Proprietário and Inquilino sections list only the links of that role (current first, then ended ones with dates) and add a link of that role; removing asks for confirmation
- [x] R5 — Salvar saves the unit and stays on the page; a new unit opens after creation; Excluir asks for confirmation and returns to the condominium's list
- [x] R6 — `/condominiums/units?pending=<value>` still shows the all-condominiums table, each row linking to the unit page
- [x] R7 — The old links work: `/condominiums/[id]/units` and `/condominiums/units/new` redirect; the global search and the module menu point to the new flow
- [x] R8 — On a phone the list and the open unit are separate screens

## E — Entities
N/A — no API change; the `units` and `unit-people` endpoints already filter by `condominium`, `block`, `type`, `active`, `query`, `pending`.

## A — Approach
- **One frame, two layouts.** A client `UnitsFrame` (the unit list and condominium picker beside the page) is rendered by `condominiums/units/layout.tsx` and `condominiums/[id]/units/layout.tsx`; it reads the condominium from the URL (`[id]` or `?condominium=`) and the open unit from the path, and does not wrap the pendency table.
- **The unit form is split by section, one form.** `UnitForm` keeps one `react-hook-form` form (Dados gerais, Cobrança) and renders the owner and tenant sections between them with the form id on the **Salvar** button (`FormActions` gets an optional `formId`), so the add-link inputs never submit the unit.
- The section index of spec 049 becomes generic (`SectionIndex` takes the section list; `currentSection` too).
- Rejected: per-section Editar (the user chose one Salvar); keeping the global table as the default (the user asked for the picker).

## S — Structure
| Path | Change |
|---|---|
| `lib/unit-workspace.ts` | new: sections, `unitsFrameState(pathname, search)`, `unitListLabel` |
| `condominiums/[id]/units/_components/UnitsFrame.tsx`, `UnitsList.tsx`, `UnitHeader.tsx` | new: frame, list column, page header |
| `condominiums/units/layout.tsx`, `condominiums/[id]/units/layout.tsx` | new: wrap in `UnitsFrame` |
| `condominiums/units/page.tsx` | pendencies table, or the "pick a condominium / pick a unit" empty state |
| `[id]/units/[unitId]/page.tsx`, `[id]/units/new/page.tsx` | the unit page and the new-unit page inside the frame |
| `UnitForm.tsx`, `unit-form/IdentificationSection.tsx`, `BillingSection.tsx` (new), `unit-people/UnitPeopleSection.tsx`, `UnitPersonForm.tsx`, `use-unit-submit.ts` | sections, role-fixed link form, stay-on-page save |
| `condominiums/units/new/page.tsx`, `NewUnitForm.tsx` | redirect / removed |
| `condominiums/_components/SectionIndex.tsx`, `lib/condominium-registry.ts`, `components/form/FormActions.tsx` | generic index, `formId` |
| `lib/module-menu.ts`, `lib/search-index.ts`, `CondominiumsList`/`[id]` page links | point to the new flow |

## O — Operations
1. `lib/unit-workspace.ts` and its test; generic `SectionIndex` / `currentSection`.
2. Frame, list column, layouts, empty states.
3. Unit page: header, sections, form split, role sections; stay-on-page save.
4. Redirects and links; docs (`folders-and-routes`, `product-scope`, `domain-model` note); gate: `tsc`, `eslint`, `pnpm test`, `pnpm build`; browser check.

## N — Norms
Tokens only; Portuguese text; client-rendered pages; no divider lines (`frontend/docs/norms/*`).

## S — Safeguards
- **Data:** nothing is deleted without a confirmation dialog; the unit list never asks for "all" units (limit 100 + search).
- **Compatibility:** no URL holding data is removed; the dashboard pendency links keep working (`?pending=`).
- **Accessibility:** the picker is a labelled select; the list is a `nav` with `aria-current`; the index follows spec 049.

## Test plan
| Criterion | Test |
|---|---|
| R1, R6, R8 | `frontend/tests/unit-workspace.test.mjs` (`unitsFrameState`: picked condominium, open unit, new, pendency view, phone screens) |
| R2 | `frontend/tests/unit-workspace.test.mjs` (`unitListLabel`) |
| R3 | `frontend/tests/unit-workspace.test.mjs` (sections order and ids) · `frontend/tests/condominium-registry.test.mjs` (`currentSection` generic) |
| R7 | `frontend/tests/app-shell.test.mjs` (menu links resolve to pages; redirects exist) |
| R4, R5 | none automated (interaction with the API): checked by hand in the browser; a gap written down |

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan, or a written gap
- [x] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean — N/A, no backend change
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change` — N/A, no API change
- [x] `docs/apps/<app>.md` updated — N/A, frontend only; frontend docs updated; `docs/known-gaps.md` row closed (if any) — none
- [x] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
