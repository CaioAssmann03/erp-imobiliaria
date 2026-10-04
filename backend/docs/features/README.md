---
summary: Process to specify a feature (questions → spec → approval → implement → close) before writing code.
read-when: you are about to build any feature
skip-if: you only need the blank template → features/_template.md; you want an example → features/001-person-type-filter.md
---
# Feature specs

**No feature is implemented before its spec exists.** A spec is one Markdown file that removes ambiguity before code is written
(structured-prompt style: it is the contract between the user and the agent, versioned in git).

## Process

1. **Understand** the request. List what is unclear (rules, fields, permissions, edge cases, frontend impact).
2. **Ask the user** every open question — short and concrete, each with your recommended answer. Do not guess.
3. **Create the spec**: copy [`_template.md`](_template.md) to `docs/features/NNN-<slug>.md` (next free number, kebab-case slug) and fill
   every section. Unknown items go in *Open questions*, never in silent assumptions.
4. **Resolve** the open questions with the user and move the answers into the proper sections.
5. **Implement** only when *Open questions* is empty. Follow `practices.md`; write tests listed in the spec.
6. **Close**: set `status: done`, check the acceptance list, update the docs of every affected app (`docs/apps/*.md`) and
   `known-gaps.md` if a gap was closed. Tell the user if the frontend client must be regenerated.

## Status values
`draft` (open questions) → `ready` (no open questions, approved) → `in-progress` → `done` (or `dropped`).

## When no spec is needed
Bug fixes and refactors that change no behavior or contract. Say explicitly that you are skipping the spec and why.

## Naming
`001-unit-people-history.md`, `002-boleto-issuing.md`. One feature per file; split large features into several specs.

## Index of specs
- `001` · [Filter persons by kind](001-person-type-filter.md) · done — worked example of a filled spec
(add a line per new spec: `NNN` · title · status)
