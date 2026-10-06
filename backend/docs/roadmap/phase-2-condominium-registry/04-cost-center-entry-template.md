---
summary: Plan and status of part 04 of phase 2 — Cost center and entry template models and API.
read-when: you work on cost center and entry template models and api or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-2-condominium-registry/README.md; you need the process → roadmap/README.md
---
# Part 04 — Cost center and entry template models and API

**Status:** moved · **Phase:** 2 (Condominium registry) · **Apps:** finance · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
Chart of accounts of a condominium (`SubConta`) and standard entry types (`Historico`).

## Scope
- [x] Models `CostCenter` and `EntryTemplate`
- [ ] Endpoints (CRUD) for both
- [ ] Django Admin for both

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| SubConta | `CostCenter` | chart-of-accounts entry of a condominium |
| Historico | `EntryTemplate` | standard entry type; points to a default cost center |

### Business rules
- None.

### Open questions
- None.

## Result
Carried over: models exist, API and admin do not (`known-gaps.md` #7). Moved to **phase 3, part 01**, which finishes it.
