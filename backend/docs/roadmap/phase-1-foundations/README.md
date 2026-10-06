---
summary: Phase 1 (Foundations) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 1: foundations
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 1 — Foundations

**Status:** done · **Source:** Sprint 1 of the sprints PDF · **Depends on:** -

## Goal
Everything the other phases stand on: repository, environment, stack, authentication, the core registry models, backoffice, CI and the first deploy. Nothing here is visible to an end user yet.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Repository and local environment](01-repository-and-environment.md) | done | - |
| 02 | [Backend and frontend stack setup](02-stack-setup.md) | done | core |
| 03 | [Authentication](03-authentication.md) | done | accounts |
| 04 | [Company and core registry models](04-core-models.md) | done | core, persons, condominiums |
| 05 | [Backoffice, CI and first deploy](05-admin-ci-deploy.md) | done | all |

## Notes
Closed on 2026-10-01. The Render deploy was the only open item at closing and is now done.

## Closing checklist
- [x] Every part is `done` or `moved`
- [x] Docs of the affected apps updated
- [x] `known-gaps.md` rows closed
- [x] Frontend client regenerated (if the API changed)
