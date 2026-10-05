---
summary: Blank REASONS feature-spec template (copy it to NNN-slug.md).
read-when: you create a new feature spec
skip-if: you need the process → features/README.md
---
<!-- When copying: rewrite the 5-line header above for the feature (summary of the feature, read-when, skip-if redirects). -->
# NNN — Title

**Status:** draft <!-- draft | ready | in-progress | done | dropped --> · **Apps:** app1, app2 · **Frontend impact:** none <!-- none | client regeneration | new screens -->

## Open questions
<!-- Everything unclear. Each with your recommended answer. Empty = ready to implement. -->
- [ ] Question? (recommended: ...)

## R — Requirements
Problem, who needs it, and the outcome. Acceptance criteria as a checklist:
- [ ] ...

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
Project rules that apply here (link the sections of `practices.md` / `architecture/*`). Naming, validation messages, ordering, N+1 control.

## S — Safeguards
Security (permissions, PII, validation), data integrity (constraints, transactions, on_delete), performance (indexes, `select_related`),
backward compatibility (API contract, migrations on existing data), failure modes.

## Test plan
- Model/constraint tests: ...
- Serializer validation tests: ...
- API tests (create, update, list, filters, permissions, errors): ...

## Docs to update when done
- `docs/apps/<app>.md`
- `docs/known-gaps.md`
