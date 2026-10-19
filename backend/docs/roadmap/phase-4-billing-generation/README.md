---
summary: Phase 4 (Billing issuance (generation)) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 4: billing issuance (generation)
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 4 — Billing issuance (generation)

**Status:** in-progress · **Source:** Sprint 4 of the sprints PDF · **Depends on:** phase 3

## Goal
Compute the monthly charge per unit and generate the boleto document in draft/homologation mode, without bank registration.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Santander accreditation (external action)](01-bank-accreditation.md) | todo | - |
| 02 | [Billing plans](02-billing-plans.md) | done | billing |
| 03 | [Billing documents](03-billing-documents.md) | todo | billing |
| 04 | [Monthly issuance task](04-monthly-issuance-task.md) | todo | billing |
| 05 | [Boleto PDF (draft)](05-boleto-pdf-draft.md) | todo | billing |
| 06 | [Billing plan screen](06-billing-plan-screen.md) | todo | frontend |

## Notes
**External action on day 1:** request the Santander Collection API accreditation (certificate + OAuth). It has the longest lead time of the project.

**Before part 02:** the per-condominium late-payment rules (fine, interest rates, grace), the competence settings and the six ideal fractions per unit are specified in [spec 020](../../features/history.md); billing plan items will name a fraction number from 1 to 6.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
