---
summary: Phase 3a of the roadmap — the hardening, refactors and contract changes decided in the known-gaps review that must land before the finance models.
read-when: you plan or start work before phase 3 (finance base), or you wonder why a known gap is not fixed yet
skip-if: you need the status of all phases → roadmap/README.md; you need one part → the numbered file in this folder; you need the gap list → known-gaps.md
---
# Phase 3a — Prerequisites for phase 3

**Status:** in-progress · **Source:** known-gaps review of 2026-10-05 (every item below is a decision recorded in `known-gaps.md`) · **Depends on:** phase 2

## Goal
Phase 3 puts money into the system. Before the first finance model: the app names are final, types are enforced, every endpoint is scoped by company, changes are audited,
errors carry codes (one client regeneration), auth is hardened and the operational basics exist. Doing these first means the new models are born correct instead of being migrated later.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Deploy docs for the new hosting](01-deploy-docs-hosting.md) | in-progress | - |
| 02 | [Rename the stub apps to English](02-rename-apps.md) | done | finance, billing, rentals, sales |
| 03 | [Clean mypy and enforce it in CI](03-mypy-in-ci.md) | done | all |
| 04 | [Validated and smaller seed_demo](04-seed-demo-validation.md) | done | core |
| 05 | [Company scoping](05-company-scoping.md) | done | accounts, core, persons, condominiums, finance |
| 06 | [Change audit trail](06-audit-trail.md) | done | core, persons, condominiums, finance |
| 07 | [Error codes and API contract cleanup](07-error-codes-and-contract.md) | done | core, condominiums, persons, finance, frontend |
| 08 | [Auth hardening: logout, throttle, HttpOnly cookies](08-auth-hardening.md) | done | accounts, core, frontend |
| 09 | [Operational hardening: health, HTTPS, admin path](09-operational-hardening.md) | in-progress | core, config |

## Order and dependencies
```
01 deploy docs ──► 02 rename apps ──┬─► 03 mypy in CI
                                    ├─► 04 seed validation
                                    └─► 05 company scoping ──┬─► 06 audit trail
                                                             └─► 07 error codes ──► 08 auth hardening ──► 09 operational hardening
                                    (09 also needs 01)
```
Parts 03 and 04 are independent refactors and can run in parallel with 05. Parts 05 to 09 each need a feature spec first (`features/README.md`); 01 to 04 need none (docs, renames and refactors that change no behavior).
Part 01 is first because it needs one answer from the user (where the backend and frontend run now) that also unblocks parts 08 and 09.

## Notes
- Phase 3 now depends on this phase. Phase 3 part 01 (cost center and entry template API) is the first new endpoint and must already use the scoping mixin (part 05) and the error codes (part 07).
- **Decided in the review but not prerequisites** (schedule between phases, as lite specs): `Person` is individual or legal, not both (gap #8); `address: null` deletes the address (gap #9);
  Block screen with the unit registry screen (gap #16). **Deferred:** backup policy (gap #19, before go-live) and structured JSON logs (gap #15, before go-live).
- Accepted as they are: the race between simultaneous sum-cap writes (gap #21), the unfold deprecation filter (gap #25).

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
