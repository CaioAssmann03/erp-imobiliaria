---
summary: Plan and status of part 03 of phase 6 — Closed period rule.
read-when: you work on closed period rule or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-6-closings-and-agreements/README.md; you need the process → roadmap/README.md
---
# Part 03 — Closed period rule

**Status:** todo · **Phase:** 6 (Closings and agreements) · **Apps:** finance · **Frontend impact:** none · **Depends on:** 01, 02
**Spec:** none yet

## Goal
A closed period rejects direct entries; only reversals are allowed.

## Scope
- [ ] Model rule in `CurrentAccountEntry.clean()` plus tests
- [ ] Define how a reversal in a closed period is dated

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- [ ] A reversal into a closed period: dated today with the original competence month? (recommended: yes)
- [ ] Can a closing be reopened, by whom and with what audit? (recommended: only a superuser, logged)

## Result
Not started.
