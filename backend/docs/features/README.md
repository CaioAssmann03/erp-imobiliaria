---
summary: Process to specify a feature (levels, questions → decisions → spec → implement → close) and the index of specs.
read-when: you are about to build any feature, or you need the list of specs and their status
skip-if: you only need a blank template → features/_template.md (full) or features/_template-lite.md (lite); you want a filled example → features/001-person-type-filter.md; you need what is planned → roadmap/README.md
---
# Feature specs

**No feature is implemented before its spec exists.** A spec is one Markdown file that removes ambiguity before code is written
(structured-prompt style: the contract between the user and the agent, versioned in git). Planned work comes from the
[roadmap](../roadmap/README.md): the **part** is the plan, the **spec** is the contract that implements it.

## Level: full or lite
| Level | Use when | Template |
|---|---|---|
| **full** | money or ledger rules, an external integration (bank, e-mail), permissions/roles, a migration on existing data, a new app or model with business rules, any change to an existing API contract | [`_template.md`](_template.md) |
| **lite** | a field, a filter, a simple endpoint, a small API tweak: no money, no integration, no permissions, no data migration | [`_template-lite.md`](_template-lite.md) |

Unsure → full. A lite spec that grows past ~30 lines becomes full.

## Process
1. **Understand** the request (and read the roadmap part, if there is one). List what is unclear: rules, fields, permissions, edge cases, frontend impact.
2. **Ask the user** every open question — short and concrete, each with your recommended answer. Do not guess, and do not decide silently.
3. **Create the spec**: copy the template of its level to `docs/features/NNN-<slug>.md` (next free number, kebab-case), **rewrite its 5-line header**, fill the sections,
   set **Roadmap** (`phase N part NN` or `none`) and link the spec in the part (`**Spec:**`). Unknown items go in *Open questions*, never in silent assumptions.
4. **Resolve**: when the user answers, move each item from *Open questions* to **Decisions** (date, decision, decided by). A choice the agent made on its own goes there too,
   marked *agent, to be confirmed*, and must be confirmed before implementing. An architecture-wide decision is also added to the table in `architecture/overview.md`.
5. **Implement** only when *Open questions* is empty and Status is `ready`. Follow `conventions/practices.md`; write the tests listed in the spec.
   Acceptance criteria are numbered (`R1`, `R2`…) and the **Test plan** maps each one to a test (`path::test_name`); a criterion without a test is written down as a gap, not omitted.
6. **Close**: tick every box of the spec's **Definition of done** (tests green, migrations clean, docs checker, client regenerated, app docs and `known-gaps.md`, roadmap part and phase, index below),
   then set `Status: done`. Tell the user if the frontend client must be regenerated.
7. **Check**: run `python backend/docs/tools/check_docs.py` (it also runs in CI). It fails on a broken link, a missing or malformed header, an unanswered question in a
   `ready`/`in-progress`/`done` spec, a `done` spec whose criteria lack a test row or whose Definition of done has an unticked box, a spec whose index row (level, status, roadmap) is wrong or missing,
   or a roadmap status that disagrees with its parts. Retro-specs (written after the code, `Roadmap: none (retro-spec)`) are exempt from the criteria and Definition-of-done rules.

## Sections that do not apply
Write `N/A` (with a reason when it is not obvious) instead of deleting a section or padding it with boilerplate. In the full template **N — Norms** lists only the project rules that apply or an exception to them;
**S — Safeguards** lists only the points that matter here. The lite template has neither.

## Status values
`draft` (open questions) → `ready` (no open questions, approved) → `in-progress` → `done` (or `dropped`).

## When no spec is needed
Bug fixes and refactors that change no behavior or contract. Say explicitly that you are skipping the spec and why.

## Naming
`001-unit-people-history.md`, `002-boleto-issuing.md`. One feature per file; split large features into several specs.

## Index of specs
One row per spec; update it in the same change that creates or closes the spec.
| Spec | Title | Level | Status | Roadmap (`phase N part NN` or `none`) |
|---|---|---|---|---|
| [001](001-person-type-filter.md) | Filter persons by kind (worked example, retro-spec) | full | done | none |
| [002](002-business-rules-in-models.md) | Business rules live only in the models (retro-spec) | full | done | none |
| [003](003-enforce-sums-and-cleanup.md) | Enforce sum caps, drop the SQLite fallback, clean imports (retro-spec) | full | done | none |
| [004](004-company-scoping.md) | Company scoping (`User.company`, `Person.company`, scope mixin) | full | done | phase 3a part 05 |
| [005](005-audit-trail.md) | Change audit trail (`django-auditlog`, masked personal data, Django 6.1 spike) | full | done | phase 3a part 06 |
| [006](006-error-codes-and-contract.md) | Error codes and API contract cleanup (flat `errors[]`, codes, `adjustment_index`) | full | done | phase 3a part 07 |
| [007](007-auth-hardening.md) | Auth hardening: logout, throttle, HttpOnly cookies | full | done | phase 3a part 08 |
| [008](008-operational-hardening.md) | Operational hardening: health, HTTPS/HSTS, admin path | full | in-progress | phase 3a part 09 |
| [009](009-cost-center-entry-template-api.md) | Cost center and entry template API and Admin | full | done | phase 3 part 01 |
| [010](010-suppliers-and-bank-accounts.md) | Suppliers and bank accounts | full | done | phase 3 part 02 |
| [011](011-accounts-payable.md) | Accounts payable (settle and cancel) | full | done | phase 3 part 03 |
| [012](012-dashboard-accounts-payable.md) | Dashboard: accounts payable section | lite | done | none |
| [013](013-pending-filters.md) | Pending filters (`?pending=`) on condominiums and units | lite | done | none |
