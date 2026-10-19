---
summary: Blank REASONS feature-spec template, FULL level (copy it to NNN-slug.md).
read-when: you create a spec for money, an external integration, permissions, or a migration on existing data (see the level rule in features/README.md)
skip-if: a small change (field, filter, simple endpoint) → features/_template-lite.md; you need the process → features/README.md
---
<!-- When copying: rewrite the 5-line header above for the feature (summary of the feature, read-when, skip-if redirects). -->
# NNN — Title

**Status:** draft <!-- draft | ready | in-progress | done | dropped --> · **Level:** full · **Roadmap:** phase N part NN <!-- or: none --> · **Apps:** app1, app2 · **Frontend impact:** none <!-- none | client regeneration | new screens -->

## Open questions
<!-- Everything unclear, each with your recommended answer. MUST be empty before Status is ready/in-progress/done. When the user answers, move the item to Decisions. -->
- [ ] Question? (recommended: ...)

## Decisions
<!-- One row per resolved question or choice. Decided by: the user, or the agent (then "agent, to be confirmed" until the user confirms). Architecture-wide decisions also go to architecture/overview.md. -->
| Date | Decision | Decided by |
|---|---|---|

## R — Requirements
Problem, who needs it, and the outcome. Acceptance criteria as a numbered checklist (the Test plan refers to these ids):
- [ ] R1 — ...
- [ ] R2 — ...

## E — Entities
New or changed models/fields (name, type, null/blank, default, validators), enums, relations, constraints.
| Entity | Change | Fields / rules |
|---|---|---|

## A — Approach
Chosen solution and why; alternatives rejected. Where logic lives (model, serializer, view, service, task).

## S — Structure
Files to create or change (exact paths). Endpoints: method, URL, request, response, filters, permissions.
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|

## O — Operations
Ordered implementation steps (migrations, data migrations, seeds, admin, serializers, views, urls, config).
1. ...

## N — Norms
Only the project rules that apply here and any exception to them (link `conventions/practices.md` / `architecture/*` sections). `N/A` if none.

## S — Safeguards
Security (permissions, PII, validation), data integrity (constraints, transactions, `on_delete`), performance (indexes, `select_related`),
backward compatibility (API contract, migrations on existing data), failure modes. `N/A` for a point that does not apply.

## Test plan
Every criterion maps to at least one test (`path::test_name`); a gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/<app>/tests/test_x.py::test_y` |

Layers to cover: model/constraint, serializer validation, API (create, update, list, filters, permissions, errors).

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [ ] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated (if **Roadmap** is set); index in `features/README.md` updated
