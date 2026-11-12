---
summary: The 3-column registry layout (list | content | right menu): frames as layouts, list, header, forms, sub-screens, right menu, back button, phone, and the recipe to add a module.
read-when: you build or change any screen with a left list and a right menu (Condomínios, Unidades, Blocos, Pessoas, Eventos, Contas a pagar, Extrato, Cobrança, ...)
skip-if: a plain form or table page → conventions/components.md; the whole-resource recipe → guides/recipes.md; which file serves a URL → structure/routes.md
---
# The 3-column registry layout

The registry screens of the ERP share one layout. Every rule below is something the code does today.

```
┌ rail ┬─────────────────────────────────────────────────────────────────────┐
│ (app │  ┌ LEFT: list ──────┐ ┌ MIDDLE: content ─────────┐ ┌ RIGHT: menu ──┐ │
│ shell│  │ Title        [+] │ │ ← Back                   │ │ NESTE …       │ │
│ )    │  │ ⌂ Condomínio ▾   │ │ 0007 · Name   Ativo      │ │   Section     │ │
│      │  │ [🔍 search  ⚙]   │ │ form / list / sub-screen │ │ CADASTROS     │ │
│      │  │ rows … 10 + more │ │ action bar (Excluir/Salvar) │ │   Item     │ │
└──────┴──┴──────────────────┴─┴──────────────────────────┴─┴───────────────┘
```

## 1. Layout lives in frames, not in pages

- The app shell (rail, global search) is `(dashboard)/layout.tsx`. The left list and the right menu belong to a **frame**: a client component rendered by a `layout.tsx` that reads the URL (`usePathname`) and draws `list + <FormPage aside={menu}>{children}</FormPage>`. Both stay mounted while you move between screens of the same frame, so a search typed in the list survives opening a record. Changing between two frames remounts the columns; that is expected.
- **The frame markup is written once**: a frame is a thin component that reads its `…FrameState` and renders `<RegistryFrame list={(className) => <XList className={className} …/>} aside={menu} showListOnPhone showPageOnPhone>` (`components/layout/RegistryFrame.tsx`). It owns the flex row, the gaps, the phone toggle and the `FormPage aside` wrapper; the frame only decides *which* list and *which* menu (no `aside` = the content takes the full width). `app-shell.test.mjs` fails if a frame copies the markup.
- A **page renders only its own content** (header + form or list). It never renders `FormPage aside=`, the list or the menu; the same test fails if a page under `condominiums/` uses `aside=`.
- The frame decides what to draw with a pure function in `lib/`: `<module>FrameState(pathname)`, returning `hasFrame`, the ids in the URL, `isNew`, and `showListOnPhone`/`showPageOnPhone`. A module whose URLs are just `/<root>/<segment>`, `/new` and `/[id]` writes it as a call to `registryFrame(pathname, root, segment, hasNew?)` (`lib/navigation/registry-frame.ts`), which only renames `id` (`entryId`, `planId`…); only the nested ones (condominium, units, blocks, sub-contas, reports) parse the path themselves. A frame with `hasFrame: false` passes the children through.
- Helpers imported by a `*-workspace.ts` use the `.ts` extension (`../navigation/registry-frame.ts`) because those modules are tested straight by Node.
- A list **scope kept in the URL** (`?condominium=`, `?month=`): `lib/navigation/url-scope.ts` has `condominiumScope` / `condominiumMonthScope` (UUID and first-of-month validation) and `scopeUrl` / `monthScopeUrl`; a module's `…Scope` is one of those (or adds its own fields) and its `use…Scope` hook is `useUrlScope(parse)`. Read ids from the URL with `uuidParam` (`lib/api/uuid-param.ts`). A scope that can be missing wraps the frame in `<Suspense>`.

| Frame (layout) | Left list | Right menu |
|---|---|---|
| `CondominiumsFrame` | `CondominiumsList` | `CondominiumSideMenu`: the form's sections; on a sub-screen *Neste condomínio* + *Cadastros* |
| `UnitsFrame` | `UnitsList` | `UnitSideMenu`: sections + *Cadastros → Pessoas* |
| `BlocksFrame` / `CostCentersFrame` | `BlocksList` / `CostCentersList` | `BlockSideMenu` / `CostCenterSideMenu` on edit (a sub-conta has no *Cadastros*); the condominium's menu on create; none on the empty screen. On a phone only the form shows (`showListOnPhone={false}`) |
| `PersonsFrame`, `BillingEventsFrame`, `CatalogFrame` | the module's list | `SectionIndex` of the form's sections |
| `AccountsPayableFrame` | `AccountsPayableList` (opens on *open* accounts; due date, *Vencida* in red) | `SectionIndex` (*Despesa*, *Conta*; paid: *Resumo*, *Comprovantes*; cancelled: *Resumo*) |
| `StatementFrame` | `StatementList` (condominiums with their balance; no **+**) | `SectionIndex` (*Saldo*, *Lançamentos*) |
| `EntriesFrame` | `EntryBatchesList` (condominium scope opens on *Todos os condomínios*; **+** always on) | `SectionIndex` (*Lote*, *Lançamentos*) |
| `CompanyAccountFrame` | `CompanyEntriesList` (date range; no search, no **+**) | `SectionIndex` (*Lançamento*); the empty screen is the balance, full width |
| `BillingEntriesFrame`, `ExtraBillingFrame`, `BillingPlansFrame` | list scoped by condominium (and month) in the URL; **+** always on | `SectionIndex` of the form's sections; none on the empty screen |
| `BillingDocumentsFrame`, `BillingRunsFrame` | list with a **required** condominium scope, then the month; no search row in Runs | `SectionIndex` (*Resumo*, *Boleto*, *Itens*, *Condições* / *Resumo*, *Problemas*) |
| `ReportsFrame` | `ReportsList` (subject filter + report rows) | none: a 2-column frame |

An empty screen is a card ("Escolha um(a) …"), full width, no right menu. Details per module: `structure/routes.md`.

## 2. Left column: the list

It is **one component**: `RegistryList` (`components/layout/RegistryList.tsx`) draws the column (sticky `aside`, title row, `toolbar`, `nav` with skeletons / empty message / rows, `footer`). A module's list only holds its query and fills the slots: `actions` (`RegistryCreate`: the **+** as a link, a button, or dimmed with `disabledHint`), `toolbar` (`ScopeSearchCard` with `CondominiumScopeSelect` and `RegistrySearch`), `blocked` (the message while a required scope is not chosen), `isEmpty`/`emptyMessage`, `footer` (`ShowMore`) and the rows (`RegistryListItem`, which owns the open/dimmed style; `onCard` for rows inside a white card). Never copy the column markup or the **+** class into a list.

1. **Title + `+`**: the module name and the icon link to the create screen. The **+** is never disabled for lack of a condominium where the create screen can ask for it itself (Unidades, Sub-contas, Blocos, Inclusão de valores, Boleto extra: `ChooseCondominiumCard`, see `conventions/forms.md`).
2. **Scope + search card** (`ScopeSearchCard`): ONE white card, a row of `ScopeSelect variant="segment"` halves split by a `ScopeDivider` (the **condominium**, then a narrower scope: the **block** in Unidades when the condominium has blocks, the **unit** in Pessoas) with the search glued under it. They are the scope of the list, not filters, so **Limpar filtros** never touches them. A `ScopeSelect` is never a native `<select>`: it opens a list with a **typing box** (accent- and case-insensitive) showing **at most 6 options**; arrows + Enter or Tab choose, Esc closes. Without a scope chosen the card is only the scope row. The search (`ScopeSearchRow`) is server search by name/code (`?query=`).
3. **Filter icon inside the search** (`CompactFilter`): only the **filters of the entity itself** (situation, type, pendency…). With a filter active a small dot shows how many; hovering lists them; **Limpar filtros** is inside the popover. `columns={2}` puts the selects side by side so the popover is short.
4. **Rows**: plain, no card; `0007 · Name` (code gray, tabular) and a second line. The open row is white with the brand bar; the others dim to 60%.
5. **Order by code** (the "ID" the staff types); the backend orders by code.
6. **10 records + "Mostrar mais"** (`useGrowingLimit(key)` + `ShowMore`): the limit goes back to 10 when the search, a filter or the scope changes. Footer: `10 de 30 pessoa(s)`.
7. **Skeletons** while loading; an empty message that says whether a filter is active.

## 3. Middle column: content

- **Width** (`FormPage`): `max-w-3xl`, `xl:max-w-4xl`, centered in the free space. From `2xl` the side columns are wider (`w-96`, `w-56`) and the gaps larger. Always through `FormPage`, flush left; without a menu it reserves the same space.
- **Header**: `RegistryHeader` with a `PhoneBackLink` (the back arrow that exists only on a phone) and the `record` from the form's query (skeleton while it loads; same query as the form, one request). A back link, then `0007 · Name` (code `text-ink-faint`) and the situation as **plain text** (`StatusText`: green when active, black when inactive; no badge). A header that is not `code · name · situation` (a batch, a plan, a document) writes its own title row.
- **Form**: sections with an id (`scroll-mt-20`) that the right menu links to; `FormActions` bar with **Excluir** (the `danger` slot, edit only), Cancelar and Salvar. Form mechanics: `conventions/forms.md`.
- **Save**: editing **stays on the page**; creating **opens the new record** (the list already shows it). Deleting goes back to the module's empty screen (or the condominium's list for blocks and sub-contas). A record used elsewhere is refused by the backend and the message reaches the toast.
- **Sub-screen of a record** (the condominium's *Blocos/Unidades/Sub-contas/Pessoas*, the unit's *Pessoas*, the block's *Unidades*): same header, then **one component**, `RegistrySubList`: title with `actions` (**+**), a white card with the search pill (`search`, `CompactFilter` in `filter`, a scope select in `above`), skeletons, the empty message, rows (`RegistryListItem onCard`; a person row is `PersonRowContent`) and the `footer` (`ShowMore`). A row opens the record, passing where you came from (section 5). The **+** of the *Pessoas* sub-screens goes to the persons module's new-person form (`newPersonUrl`, carrying `?condominium=`, `?unit=` and `from`), because a person is registered there.

## 4. Right column: the menu (`SectionIndex`)

- Two kinds of items: **sections** of the page (anchors with a thin rail and a black line that slides with the scroll; when the page is too short to scroll the line covers every item and shrinks back as the page grows: `pageSmallness`, `markerSpan` in `lib/condominiums/condominium-registry.ts`; group titles in plain small gray text) and **links** (`links`: one group or a list of groups) to other screens.
- The titles are **the same on every screen of a record**: *Neste condomínio* then *Cadastros*; *Nesta unidade* then *Cadastros*. On a sub-screen the sections become links back to the page (`condominiumUrl(id, section)` or `unitUrl#section`) and the open screen is highlighted (`current`). Do not rename or drop the groups when you enter a sub-screen.
- Below `xl` the menu becomes a **sticky row of buttons** under the header (the active one centered).

## 5. The back button: the path you took

- The arrow above the title (`BackLink`) goes back to **the screen you came from**, all the way: condomínio → *Blocos* → a block → its *Unidades* → a unit → its *Pessoas* → a person comes back one step at a time.
- How: a link from a screen to a deeper one carries `?from=<the screen it is on, with its own query>` (`withFrom`, `useCurrentUrl`). The origin's query includes **its own** `from`, so it is a real stack. `backTargetOf(value)` (`lib/navigation/back-target.ts`) validates the whole chain (only known screens; ids as UUID; at most 6 levels; anything else is dropped, because the value becomes a link) and gives the label (`Blocos`, `Bloco`, `Unidade`…).
- **Without a `from`** the arrow goes to the condominium page (`← Condomínio`); a person falls back to the condominium by `?condominium=`, and on a phone to the persons list.
- **Who passes it**: central lists (`BlocksRegistryList`, `UnitsRegistryList`, `CostCentersRegistryList`, `CondominiumPeopleList`, `UnitPeopleList`, `BlockUnitsList`) pass the screen they are on; the right menus pass the page they are on to the sub-screen they open and, from a sub-screen, link back keeping its own origin (`pageKeepingOrigin`); the **left lists** only pass through the `from` they were opened with, because switching record there is the same step.
- A person's URL also carries `?condominium=` and `?unit=` (`personUrl`/`personsUrl` in `lib/persons/person-workspace.ts`): they pre-filter the persons list to what you were looking at.
- The scope that cuts a list **travels with the link**: a unit opened from a block's *Unidades* carries `?block=` and the units list stays on that block (`UnitsList` keeps the block it had when a link brings none; only a new block in the URL, the select or another condominium change it).
- When you add a link from a record to another screen, pass `from`; when you add a screen that can be a `from`, add its path to `labelOfPath` in `back-target.ts` (and a test).

## 6. Phone

The list and the open record are **separate screens** (`showListOnPhone`/`showPageOnPhone`), with `← Pessoas` etc. on the record to go back. Inputs use 16 px under `lg`, menu rows are 44 px, the app menu keeps only the screens that exist.

## 7. Recipe: add a module in this layout

1. **Backend**: ordered by `code` (`Meta.ordering`); a `?query=` search; a filter for what the list needs; an optional `code` given by the server when left out (lowest free number) if the staff types it.
2. **`lib/<module>/<module>-workspace.ts`**: URLs, section list and `<module>FrameState(pathname)` (pure, with a test in `tests/`; for the plain `list | new | [id]` shape it is a `registryFrame(...)` call).
3. **Components** in the module's `_components/`: `…ListItem` (a `RegistryListItem`), `…List` (a `RegistryList`), `…Frame` (a `RegistryFrame`), `…Header` (a `RegistryHeader` with a `PhoneBackLink`), `…DeleteButton` (a `RecordDeleteButton`); the form (a `RecordForm` with `SectionAnchor` ids, `useRecordForm` and `useRecordSubmit`) with the `danger` slot and the save behavior of section 3.
4. **Routes**: `layout.tsx` (the frame), `page.tsx` (empty screen), `new/page.tsx`, `[id]/page.tsx` (content only); a redirect page if the module moved. Under `/condominiums`, add the segment to `RESERVED_SEGMENTS` in `condominium-registry.ts`, `block-workspace.ts` and `cost-center-workspace.ts`.
5. **Navigation**: `lib/navigation/module-menu.ts`, `lib/navigation/search-index.ts`, the dashboard links.
6. **Docs and tests**: a row in `structure/routes.md`, a state test, the frame in the `app-shell` test.
7. **Check**: `tsc`, `eslint`, `pnpm test`, and open it in a browser at 1440 px, ≥ 1900 px and a phone width.

## 8. Tests that guard it

`tests/app-shell.test.mjs` (frames draw the menu; pages never do), `tests/*-workspace.test.mjs` (frame states and URLs), `tests/back-target.test.mjs` (the `from` whitelist), `tests/condominium-registry.test.mjs` (reserved segments, kept section), `tests/module-menu.test.mjs`.
