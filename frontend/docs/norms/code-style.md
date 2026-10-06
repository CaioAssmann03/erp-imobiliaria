---
summary: TypeScript, React and import conventions.
read-when: you write or review code
skip-if: naming → norms/language-and-naming.md; component rules → norms/components.md
---
# Code style (N — Norms)

**TypeScript**
- No `any`, no `@ts-ignore`. Use generated models (`@/lib/api/generated/models`) and small local types.
- `interface XxxProps` beside the component; type public returns; `import type` for types.
- Narrow `unknown` instead of casting. An unavoidable cast (API payload) lives in **one** place
  (`*ToPayload` or the submit hook). A wrong generated type is fixed at the source (backend/orval), not cast away.

**React**
- Function components, named exports (default export only for `page.tsx`/`layout.tsx`).
- Return early instead of nesting. Derive values during render; never mirror props/query data into state.
- Do not mutate variables during render (lint rule `react-hooks/immutability`).
- Keys are stable ids, not indexes. Handlers: inline arrow if short, `handleXxx` if longer.
- No business logic in JSX: payloads, formatting and calculations are pure functions in `lib/` or a hook.

**Imports**
- `@/` = frontend root. Inside a route use **relative** paths for that route's components
  (`./_components/X`); use `@/` for `components/`, `lib/`, `hooks/`.
- Order: libraries, `@/...`, relative; blank line between groups. Named imports from icon/UI libs (tree-shaking).

**Comments**: explain why, not what. A JSDoc on a component or hook only when it says something the name and props do not (a reason, a constraint such as "the first page comes hydrated from the server", a format example, a security note); never a sentence that restates the name. No dead code, no stray `console.log`.
**Tooling**: `eslint` (Next core-web-vitals + TS), `tsc --noEmit`; generated code is lint-ignored.
