---
summary: Task → files routing table for the frontend docs.
read-when: you start any frontend task
skip-if: you already know the file → open it directly
---
# Frontend docs

Find your task, open **only** the listed files (usually 2–3). Read the header first (first 6 lines of any doc: `summary` / `read-when` / `skip-if`); if `skip-if` matches, follow its pointer without reading the rest.

| Task | Open |
|---|---|
| The big picture, modules, stack, why pages render this way | `overview.md` |
| A registry module or screen (list \| content \| right menu), back button, scope filters, sub-screens | `structure/registry-layout.md` · `structure/routes.md` |
| Which file serves a URL; where a new file goes | `structure/routes.md` · `structure/folders.md` |
| New CRUD resource / page | `guides/recipes.md` → `conventions/components.md` |
| A server page vs a client component; list, form or widget anatomy | `conventions/components.md` |
| Change a form or field | `conventions/forms.md` · `domain-model.md` |
| Call the API, cache, invalidate, filter or paginate a list | `conventions/data-and-cache.md` |
| Styling, colors, theme, accent, a UI library | `conventions/design-system.md` |
| Naming, language (EN code / PT UI), imports, code style | `conventions/code.md` |
| Entity fields, enums, business rules | `domain-model.md` |
| Public pages (landing, features, how-it-works, contato), sitemap, Open Graph | `features/marketing.md` · `quality/accessibility-and-seo.md` |
| The help chat in the ERP header | `features/assistant.md` |
| Login, token, cookie, `proxy.ts`, the `/api` handler | `quality/auth-and-tokens.md` |
| Input, URLs, redirects, PII, headers, CSP | `quality/secure-coding.md` |
| Speed, bundle, re-renders | `quality/performance.md` |
| Titles, accessibility, SEO | `quality/accessibility-and-seo.md` |
| Regenerate the client, add a field/accent/nav item, finish a change (checklist) | `guides/recipes.md` |

## Folder map

`overview.md` and `domain-model.md` (what and why) · `structure/` (folders, routes, the registry layout) · `conventions/` (how to write code: components, data, forms, design, style) · `features/` (the public site and the assistant) · `guides/` (recipes and the finish checklist) · `quality/` (auth, security, accessibility, performance).

## Rules that always hold

- Code in English, UI text in Portuguese; docs and `AGENTS.md` in English.
- **Pages are server shells** (no API call, not even the home); everything that fetches or interacts is a **small client component** under them.
- **The backend owns the logic**: filtering, search, ordering, pagination, totals and rules are API params and endpoints; the client never filters, sorts or aggregates a list, and keeps its filter UI small. Missing something? Add it to the backend, regenerate, send the param.
- **Cache**: generated hooks only, no prefetch or `initialData`, invalidate with the generated key functions after every mutation, never copy query data into state.
- Registry screens use the 3-column layout, drawn by frames (pages render only their content).
- Tokens only; never edit `lib/api/generated/`.
- Update the doc you changed in the same change.
