---
summary: Blank feature-spec template, LITE level for small changes (copy it to NNN-slug.md).
read-when: you specify a small change: a field, a filter, a simple endpoint, a UI-only API tweak
skip-if: money, external integration, permissions or migration on existing data → features/_template.md; you need the process → features/README.md
---
<!-- When copying: rewrite the 5-line header above for the feature. A lite spec is about 20–30 lines; if it grows past that, switch to the full template. -->
# NNN — Title

**Status:** draft <!-- draft | ready | in-progress | done | dropped --> · **Level:** lite · **Roadmap:** none <!-- or: phase N part NN --> · **Apps:** app1 · **Frontend impact:** none <!-- none | client regeneration | new screens -->

## Open questions
<!-- MUST be empty before Status is ready/in-progress/done. Answered ones move to Decisions. -->
- [ ] Question? (recommended: ...)

## Decisions
| Date | Decision | Decided by |
|---|---|---|

## R — Requirements
What and why, in two or three lines, then the numbered acceptance checklist:
- [ ] R1 — ...

## E — Entities
`No schema change.` or the fields/constraints that change (name, type, null/blank, default, validators).

## S — Structure
Files to change (exact paths) and the endpoint(s): method, URL, query/body, response.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/<app>/tests/test_x.py::test_y` |

## Definition of done
- [ ] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [ ] `docs/apps/<app>.md` updated; roadmap part/phase and the spec index updated (if applicable)
