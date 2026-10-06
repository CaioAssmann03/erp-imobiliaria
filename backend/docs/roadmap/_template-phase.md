---
summary: Blank template for a roadmap phase README (copy it to phase-N-slug/README.md).
read-when: you create a new roadmap phase
skip-if: you need the template of a part file → roadmap/_template-part.md; you need the process → roadmap/README.md
---
<!-- When copying: rewrite the 5-line header above for the phase (summary, read-when, skip-if redirects). -->
# Phase N — Title

**Status:** todo <!-- todo | in-progress | done --> · **Source:** Sprint N of the sprints PDF · **Depends on:** phase N-1

## Goal
What this phase delivers and why it comes at this point.

## Parts
<!-- One row per part file. The phase status is derived: all parts done/moved = done; any in-progress/done = in-progress. -->
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Title](01-slug.md) | todo | app |

## Notes
Risks, external actions with lead time, carry-overs from other phases.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
