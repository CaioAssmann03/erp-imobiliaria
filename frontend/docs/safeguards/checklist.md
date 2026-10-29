---
summary: Commands and pre-finish checklist (tsc, eslint, build, review questions).
read-when: you are about to finish any change
skip-if: you need a how-to → docs/README.md routing table
---
# Quality checklist (S — Safeguards)

```bash
cd frontend
pnpm exec tsc --noEmit  # types
pnpm exec eslint .      # lint (generated code ignored)
pnpm test           # unit tests of pure helpers (node:test, tests/*.test.mjs; also runs in CI)
pnpm build          # validates pages, routes, server/client boundaries
```
API changed → backend running → `pnpm generate:api` first. Stale type errors after renaming routes → delete `.next/` and rebuild.

- [ ] Code English, user text Portuguese (norms/language-and-naming.md)
- [ ] File in the right place; ≤ ~100 lines; logic outside JSX (norms/components.md)
- [ ] `page.tsx` makes no API call; `"use client"` for what calls the API
- [ ] Tokens only; works at mobile width (norms/design-system.md)
- [ ] Generated hooks only; invalidations cover dependents (norms/data-and-cache.md)
- [ ] Schema + `toForm`/`toPayload`; server errors handled (norms/forms.md)
- [ ] No token/PII in logs, storage, props, toasts; links/redirects validated (safeguards/secure-coding.md)
- [ ] Labels, keyboard, focus, `metadata.title` (safeguards/accessibility-and-seo.md)
- [ ] Loading, empty, error, success states handled
- [ ] The doc describing what you changed is updated

Manual: create, edit, delete; client and server validation errors; reload a filtered list; sign out/in; narrow viewport.
Review: a `page.tsx` that fetches or hydrates (it should not)? client boundary higher than needed? loose color/size, `any`, `@ts-ignore`,
`console.log`? duplicated logic that belongs in `lib/` or a hook?
