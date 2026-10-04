# Frontend docs — REASONS index

Organized by the SPDD **REASONS** canvas so an agent loads the minimum: **R**equirements · **E**ntities · **A**pproach ·
**S**tructure · **O**perations · **N**orms · **S**afeguards. Each file is short, self-contained and starts with `read-when`.

**Load budget:** pick the row for your task, open those files only (usually 2–3). Do not read the rest.

## Task → files

| Task | Open |
|---|---|
| New CRUD resource / page | `operations/new-resource-page.md` → `structure/component-patterns.md` |
| Change a form or field | `norms/forms.md` · `entities/domain-model.md` |
| Change a list / table / filter | `structure/component-patterns.md` · `norms/data-and-cache.md` |
| Create or move a component | `norms/components.md` · `structure/folders-and-routes.md` |
| Call the API, prefetch, invalidate | `norms/data-and-cache.md` (+ `norms/tanstack-query.md` for advanced use) |
| Styling, colors, theme, accent | `norms/design-system.md` |
| Login, token, cookie, `proxy.ts` | `safeguards/auth-and-tokens.md` (+ `safeguards/http-hardening.md`) |
| Anything handling input, URLs, PII | `safeguards/secure-coding.md` |
| Speed, bundle, re-renders | `safeguards/performance.md` |
| Dashboard widget, nav item, small recurring job | `operations/recipes.md` |
| Naming, language, imports, code style | `norms/language-and-naming.md` · `norms/code-style.md` |
| Titles, a11y, SEO | `safeguards/accessibility-and-seo.md` |
| Finishing any change | `safeguards/checklist.md` |
| Understand the product or the stack | `requirements/product-scope.md` · `approach/architecture.md` |

## Files by REASONS section

| Folder | File | Contains |
|---|---|---|
| `requirements/` | `product-scope.md` | modules, out of scope, non-functional requirements |
| `entities/` | `domain-model.md` | entities, fields, enums, business rules, dashboard summary |
| `approach/` | `architecture.md` | stack, key decisions and why, data flow, rendering, `proxy.ts` |
| `structure/` | `folders-and-routes.md` | tree, routes, where new code goes |
| | `component-patterns.md` | list, form, related records, widget anatomy |
| `operations/` | `new-resource-page.md` | end-to-end recipe for a new resource |
| | `recipes.md` | regenerate client, add field/widget/accent/nav, auth change |
| `norms/` | `language-and-naming.md` | English code / Portuguese UI, naming table |
| | `code-style.md` | TypeScript, React, imports |
| | `components.md` | Server vs Client, placement, size, styling |
| | `forms.md` | schema → form → payload → errors; react-hook-form + Zod |
| | `design-system.md` | tokens, density, theming (mode/accent/font) |
| | `data-and-cache.md` | generated client, request path, QueryClient, hydration, invalidation |
| | `tanstack-query.md` | query/mutation usage details |
| | `ui-libraries.md` | Tailwind, shadcn/Base UI, lucide, sonner, recharts |
| `safeguards/` | `auth-and-tokens.md` | cookie auth today, limits, HttpOnly hardening plan |
| | `secure-coding.md` | secrets, XSS, redirects, PII, dependencies |
| | `http-hardening.md` | headers, CSP, cookie flags, CORS |
| | `performance.md` | rendering, data, bundle, assets techniques |
| | `accessibility-and-seo.md` | a11y rules, titles/metadata |
| | `checklist.md` | commands and pre-merge checklist |

## Always true
Code English, UI text Portuguese · Server Component by default · tokens only · never edit `lib/api/generated/` ·
**docs and `AGENTS.md` in English** · update the doc you changed in the same change.
