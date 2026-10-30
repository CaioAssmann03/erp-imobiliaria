---
summary: English-code / Portuguese-UI rule and the naming table.
read-when: you name anything or write user-facing text
skip-if: code formatting → norms/code-style.md
---
# Language and naming (N — Norms)

| English (code) | Portuguese (what the user reads) |
|---|---|
| file/folder/**route** names | titles, labels, placeholders, hints |
| components, functions, variables, props, types | error and success messages (`toast`) |
| object keys, filter values, ids (`?status=active`, `/dashboard?focus=pending`) | empty-list texts, descriptions |
| API field names | `aria-label`, `title`, page `metadata` |
| docs and `AGENTS.md` | |

- Code names follow the backend, so the generated client is used untranslated.
- External Portuguese sources (ViaCEP) are converted to English at the edge (`hooks/use-cep-lookup.ts`).
- Search keywords (`lib/navigation/search-index.ts`) stay Portuguese (users type them). Comments: either language.

## Names

| What | Pattern | Example |
|---|---|---|
| Component | `PascalCase`, same file name | `CondominiumRow.tsx` |
| Hook | `useX`, file `use-x.ts` | `use-unit-submit.ts` |
| Pure function/util | `camelCase`, file `kebab-case.ts` | `person-document.ts` |
| Constant | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| Type | `PascalCase` | `UnitFormInput` |
| Route/section folder | `kebab-case`, English | `units`, `condominium-form` |
| Private folder | `_components` | |
| Page | `page.tsx`, `XxxPage` | `EditUnitPage` |

Roles: forms `XxxForm` / `XxxSection` / `use-xxx-submit`; lists `XxxTable` / `XxxFilters` / `XxxRow`.
Commits: English, repository style (`feat:`, `fix:`, `refactor:`, `docs:`).
