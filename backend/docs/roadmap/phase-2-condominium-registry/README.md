---
summary: Phase 2 (Condominium registry) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 2: condominium registry
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 2 — Condominium registry

**Status:** done · **Source:** Sprint 2 of the sprints PDF · **Depends on:** phase 1

## Goal
First real vertical slice (backend + frontend together) replicating the registries of the reference system (Sami): condominiums, units, people and their links.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Condominium and block endpoints](01-condominium-api.md) | done | condominiums |
| 02 | [Unit, person and link endpoints](02-unit-person-api.md) | done | condominiums, persons |
| 03 | [Registry screens](03-registry-screens.md) | done | frontend |
| 04 | [Cost center and entry template models and API](04-cost-center-entry-template.md) | moved | finance |

## Notes
Closed on 2026-10-01 with small scope caveats. One item was carried over to phase 3 (cost center / entry template API).

## Closing checklist
- [x] Every part is `done` or `moved`
- [x] Docs of the affected apps updated
- [x] `known-gaps.md` rows closed
- [x] Frontend client regenerated (if the API changed)
