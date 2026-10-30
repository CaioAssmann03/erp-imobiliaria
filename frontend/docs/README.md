---
summary: Task → files routing table for the frontend docs.
read-when: you start any frontend task
skip-if: you already know the file → open it directly
---
# Frontend docs (REASONS)

Organized by the SPDD REASONS canvas. Find your task, open **only** the listed files (usually 2–3). **Read the header first** (first 6 lines of any doc:
`summary` / `read-when` / `skip-if`); if `skip-if` matches or the summary is not what you need, follow its pointer without reading the rest.

| Task | Open |
|---|---|
| New CRUD resource / page | `operations/new-resource-page.md` → `structure/component-patterns.md` |
| A module or screen in the **3-column layout** (list, content, right menu), the back button, scope filters, sub-screens | `structure/three-column-layout.md` |
| Change a form or field | `norms/forms.md` · `entities/domain-model.md` |
| Change a list / table / filter | `structure/component-patterns.md` · `norms/data-and-cache.md` |
| Create or move a component | `norms/components.md` · `structure/folders-and-routes.md` |
| Call the API, fetch on the client, invalidate | `norms/data-and-cache.md` (+ `norms/tanstack-query.md` for advanced use) |
| Styling, colors, theme, accent | `norms/design-system.md` |
| Public pages (landing, features, how-it-works) | `norms/marketing.md` · `structure/folders-and-routes.md` |
| Login, token, cookie, `proxy.ts` | `safeguards/auth-and-tokens.md` (+ `safeguards/http-hardening.md`) |
| Input, URLs, redirects, PII | `safeguards/secure-coding.md` |
| Speed, bundle, re-renders | `safeguards/performance.md` |
| Widget, nav item, accent, small recurring job | `operations/recipes.md` |
| Naming, language, imports, code style | `norms/language-and-naming.md` · `norms/code-style.md` |
| Libraries (Tailwind, shadcn, sonner, recharts) | `norms/ui-libraries.md` |
| Titles, accessibility, SEO | `safeguards/accessibility-and-seo.md` |
| Finishing any change | `safeguards/checklist.md` |
| Product or stack | `requirements/product-scope.md` · `approach/architecture.md` |

## Folder map
`requirements/` scope · `entities/` domain model · `approach/` architecture and decisions · `structure/` folders, routes, patterns · `operations/` recipes ·
`norms/` conventions · `safeguards/` security, performance, a11y, checklist.

Always true: code English, UI text Portuguese · every page renders on the client (static shell + client queries) · registry screens use the 3-column layout, drawn by frames (pages render only their content) · tokens only · never edit `lib/api/generated/` · docs and `AGENTS.md` in English ·
update the doc you changed in the same change.
