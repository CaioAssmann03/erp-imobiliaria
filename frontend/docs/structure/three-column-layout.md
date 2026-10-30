---
summary: The 3-column registry layout (list | content | right menu): frames as layouts, list, header, forms, sub-screens, back button, filters, phone, and the recipe to add a module.
read-when: you build or change Condomínios, Unidades, Blocos, Sub-contas, Pessoas, Eventos or any new screen in the 3-column layout
skip-if: a plain form or table page → structure/component-patterns.md; the whole-resource recipe → operations/new-resource-page.md; routes only → structure/folders-and-routes.md
---
# The 3-column layout (S — Structure)

The registry screens of the ERP share one layout. Every rule below is something the code does today; the tests named at the end keep part of it from regressing.

```
┌ rail ┬──────────────────────────────────────────────────────────────────────┐
│ (app │  search bar on the dashboard; elsewhere the rail button │
│ shell│  ┌ LEFT: list ──────┐ ┌ MIDDLE: content ─────────┐ ┌ RIGHT: menu ──┐ │
│ )    │  │ Title        [+] │ │ ← Back                   │ │ NESTE …       │ │
│      │  │ ⌂ Condomínio ▾   │ │ 0007 · Name   Ativo      │ │   Section     │ │
│      │  │ [🔍 search  ⚙]   │ │ form / list / sub-screen │ │ CADASTROS     │ │
│      │  │ rows … 10 + more │ │ action bar (Excluir/Salvar)│ │   Item        │ │
└──────┴──┴──────────────────┴─┴──────────────────────────┴─┴───────────────┴─┘
```

## 1. Layout lives in frames, not in pages
- The app shell (rail, global search) is `(dashboard)/layout.tsx`. The left list and the right menu belong to a **frame**: a client component rendered by a `layout.tsx` that reads the URL (`usePathname`) and draws `list + <FormPage aside={menu}>{children}</FormPage>`. Both stay mounted while you move between screens of the same frame (checked in a real browser: the same DOM element before and after a navigation).
- A **page renders only its own content** (header + form or list). It never renders `FormPage aside=`, the list or the menu. A test (`tests/app-shell.test.mjs`) fails if a page under `condominiums/` uses `aside=`.
- The frame decides what to draw with a pure function in `lib/`: `registryLayout`/`selectedCondominiumId` (condominium), `unitsFrameState`, `blocksFrameState`, `costCentersFrameState`, `personsFrameState`, `eventsFrameState`. Each returns `hasFrame`, the ids in the URL, `isNew`, and `showListOnPhone`/`showPageOnPhone`. A frame with `hasFrame: false` passes the children through (the plain pages keep their own `FormPage`).

| Frame (layout) | Left list | Right menu |
|---|---|---|
| `CondominiumsFrame` (`condominiums/layout.tsx`) | `CondominiumsList` | `CondominiumSideMenu` (sections on the page; *Neste condomínio* + *Cadastros* on a sub-screen) |
| `UnitsFrame` | `UnitsList` | `UnitSideMenu` (sections + *Cadastros → Pessoas*) or the sections on a new unit |
| `BlocksFrame` / `CostCentersFrame` | `BlocksList` / `CostCentersList` | `BlockSideMenu` / `CostCenterSideMenu` on edit (the sub-conta has no *Cadastros*: nothing is registered inside it); the condominium's menu on create |
| `PersonsFrame` | `PersonsList` | `SectionIndex` (Identificação, Contato) |
| `BillingEventsFrame` | `BillingEventsList` | `SectionIndex` (Identificação) |

- Changing between two frames (or from a screen without a list, like the dashboard) remounts the columns; that is expected.
- A route segment that is not an id is **reserved** in `/condominiums/<segment>` (`new`, `units`, `blocks`, `cost-centers`, `persons`, `events`): add the new one to the `RESERVED_SEGMENTS` of `condominium-registry.ts`, `block-workspace.ts` and `cost-center-workspace.ts`.
- A **new folder under `app/` is not seen by the Docker dev server** (bind mount): `docker compose restart frontend` after creating one.

## 2. Left column: the list
Same anatomy everywhere (`CondominiumsList` is the model):
1. **Title + `+`**: the module name ("Unidades", "Blocos", "Sub-contas", "Pessoas") and the icon link to the create screen (disabled when it needs a scope that is not chosen).
2. **The scope + search card** (`ScopeSearchCard`, `components/ScopeSearchCard.tsx`): ONE white card with a row of scope selects on top and the search glued under it, no gap and no line between them. The row holds `ScopeSelect variant="segment"` halves split by a `ScopeDivider`: the **condominium** (wide half, shows its name; "Selecione o condomínio" when none, or "Todos os condomínios" in Pessoas) and, when the list has a narrower scope, a second half: the **block** in Unidades (only if the condominium has blocks, "Todos os blocos" in gray until one is chosen) and the **unit** in Pessoas (once a condominium is chosen). They are the scope of the list, not filters, so **Limpar filtros** never touches them. A `ScopeSelect` is never a native `<select>`: it opens a list with a **typing box** (accent- and case-insensitive) showing **at most 6 options** (no "x of y" text: if it is not there, type more); arrows + Enter or Tab choose, Esc closes. Without a scope chosen the card is only the scope row (no search). Below it the search row (`ScopeSearchRow`): server search by name/code (blocks filter on the client: the API has no name search).
3. **Filter icon inside the search** (`CompactFilter`): only the **filters of the entity itself** (situation, type, pendency…). With a filter active the icon is highlighted and a badge shows how many; hovering it lists them ("Tipo: Apartamento · Situação: Ativas"). There is no summary line: the values are read, and cleared (**Limpar filtros**), inside the popover. `columns={2}` puts the selects side by side so the popover is short.
4. **Rows**: plain, no card; `0007 · Name` (code gray, tabular) and a second line (city, document, "Inativo"…). The open row is white with the brand bar; the others dim to 60%.
5. **Order by code** (the "ID" the staff types). The default order of the model is by code in the backend (condominium, person, sub-conta by condominium then code, event).
6. **10 records at first + "Mostrar mais"** (`useGrowingLimit(key)` + `ShowMore`): the limit goes back to 10 when the search, a filter or the scope changes (`key`). Footer: `10 de 30 pessoa(s)`.
7. **Skeletons** while loading; an empty message that says whether a filter is active.

The list belongs to the frame, so a search typed in it survives opening a record.

## 3. Middle column: content
- **Width** (`FormPage`): `max-w-3xl`, `xl:max-w-4xl`; the column takes all the free space and the form is centered in it, so on a wide screen the left list and the right menu stay at the edges and the leftover is split on both sides of the form. From `2xl` the side columns are wider (`w-96`, `w-56`) and the gaps larger (`gap-12`).
- **Header**: a back link, then `0007 · Name` (code `text-ink-faint`) and the situation as **plain text** (`StatusText`: green when active, black when inactive; no badge; the condominium and unit headers still use amber for inactive). It reads the same query as the form (one request).
- **Form**: sections with an id (`scroll-mt-20`) that the right menu links to; `FormActions` bar with **Excluir** (the `danger` slot, edit only), Cancelar and Salvar; the error summary above it.
- **Save**: editing **stays on the page**; creating **opens the new record** (the list beside it already shows it). Deleting goes back to the module's empty screen (or the condominium's list for blocks and sub-contas). A record used elsewhere is refused by the backend and the message reaches the toast.
- **Empty screen** (`/condominiums/persons`, `/billing/events`…): a card "Escolha um(a) …", full width, no right menu.
- **Sub-screen of a record** (the condominium's *Blocos/Unidades/Sub-contas/Pessoas*, the unit's *Pessoas*, the block's *Unidades*): same header, then a white card with a search pill and plain rows (10 + *Mostrar mais*); a row opens the record, passing where you came from (section 5).

## 4. Right column: the menu (`SectionIndex`)
- Two kinds of items: **sections** of the page (anchors with a marker that follows the scroll) and **links** (`links`: one group or a list of groups, each with its title) to other screens.
- The titles are **the same on every screen of a record**: *Neste condomínio* then *Cadastros*; *Nesta unidade* then *Cadastros*. On a sub-screen the sections become links back to the page (`condominiumUrl(id, section)` or `unitUrl#section`) and the open screen is highlighted (`current`). Do not rename or drop the groups when you enter a sub-screen.
- Below `xl` the menu becomes a **sticky row of buttons** under the header (the active one centered), so nothing is unreachable on a phone.

## 5. The back button: the path you took
- The arrow above the title (`BackLink`) goes back to **the screen you came from**, and that goes on all the way: condomínio → *Blocos* → a block → its *Unidades* → a unit → its *Pessoas* → a person comes back one step at a time (`Pessoas da unidade` → `Unidade` → `Unidades do bloco` → `Bloco` → `Blocos`).
- How: a link from a screen to a deeper one carries `?from=<the screen it is on, with its own query>` (`withFrom`, `useCurrentUrl`). The query of the origin includes **its own** `from`, so it is a real stack: when you go back, that screen still knows where it came from. `backTargetOf(value)` (`lib/back-target.ts`) validates the whole chain (only the condominium, a block, a sub-conta, a unit and the lists/sub-screens of those; ids as UUID; a nested `from` valid too; at most 6 levels; anything else is dropped, because the value becomes a link) and gives the label (`Blocos`, `Bloco`, `Unidade`…).
- **Without a `from`** (the record was opened directly, from the dashboard or by URL) the arrow goes to the condominium page (`← Condomínio`), the default of a record inside a condominium; a person falls back to the condominium by `?condominium=`, and on a phone to the persons list.
- **Who passes it**: central lists (`BlocksRegistryList`, `UnitsRegistryList`, `CostCentersRegistryList`, `CondominiumPeopleList`, `UnitPeopleList`, `BlockUnitsList`) pass the screen they are on; the right menus pass the page they are on to the sub-screen they open (`BlockSideMenu`, `UnitSideMenu`) and, from a sub-screen, link back to the page **keeping its own origin** (`pageKeepingOrigin`); the **left lists** only pass through the `from` they were opened with, because switching record there is the same step (`UnitsList`, `BlocksList`, `CostCentersList`, `PersonsList`).
- A person's URL also carries `?condominium=` and `?unit=` (`PersonContext`, `personUrl`/`personsUrl` in `lib/person-workspace.ts`): they **pre-filter the persons list** to what you were looking at and travel on to the next person you open from that list.
- The scope that cuts a list **travels with the link** and the list follows the URL, so it is not lost on the way: a unit opened from a block's *Unidades* carries `?block=` and the units list stays on that block, even when you open another unit from it or go to the unit's *Pessoas* (the menu links add the `block` they are under; `UnitsList` also keeps the block it had when a link brings none, and only a new block in the URL, the select or another condominium change it). Read ids from the URL with `uuidParam` (`lib/uuid-param.ts`).
- When you add a link from a record to another screen, pass `from`; when you add a screen that can be a `from`, add its path to `labelOfPath` in `back-target.ts` (and a test).

## 6. Phone
- The list and the open record are **separate screens** (`showListOnPhone`/`showPageOnPhone`), with `← Pessoas` etc. on the record to go back to the list.
- Inputs use 16 px under `lg` (iOS zoom), menu rows are 44 px, the app menu keeps only the screens that exist. See `requirements/product-scope.md`.

## 7. Recipe: add a module in this layout
1. **Backend**: ordered by `code` (`Meta.ordering`); a `?query=` search; a filter for what the list needs; a code that is optional and given by the server when left out (lowest free number, see events) if the staff types it.
2. **`lib/<module>-workspace.ts`**: the URLs, the section list and `<module>FrameState(pathname)` (pure, with a test in `tests/`).
3. **Components** in the module's `_components/`: `…ListItem`, `…List` (section 2), `…Frame` (section 1), `…Header` (section 3), `…DeleteButton`; the form with the section ids, the `danger` slot and the save behaviour of section 3.
4. **Routes**: `layout.tsx` (the frame), `page.tsx` (empty screen), `new/page.tsx`, `[id]/page.tsx` (content only); a redirect page if the module moved.
5. **Navigation**: `lib/module-menu.ts`, `lib/search-index.ts`, the dashboard links; reserve the segment if it is under `/condominiums`.
6. **Docs and tests**: `structure/folders-and-routes.md` row, `requirements/product-scope.md`, a state test, and the frame in the `app-shell` test.
7. **Check**: `tsc`, `eslint`, `pnpm test`, and open it in a browser at 1440 px, ≥1900 px and a phone width.

## 8. Tests that guard it
`tests/app-shell.test.mjs` (frames draw the menu; pages never do), `tests/*-workspace.test.mjs` (frame states and URLs), `tests/back-target.test.mjs` (the `from` whitelist), `tests/condominium-registry.test.mjs` (reserved segments, kept section), `tests/module-menu.test.mjs`.
