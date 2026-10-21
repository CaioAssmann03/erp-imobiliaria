---
summary: Phase 4 (Billing issuance (generation)) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 4: billing issuance (generation)
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 4 — Billing issuance (generation)

**Status:** done · **Source:** Sprint 4 of the sprints PDF · **Depends on:** phase 3

## Goal
Compute the monthly charge per unit and generate the boleto document in draft/homologation mode, without bank registration.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Payment gateway account (Asaas, external action)](01-bank-accreditation.md) | done | - |
| 02 | [Billing plans](02-billing-plans.md) | done | billing |
| 03 | [Billing documents](03-billing-documents.md) | done | billing |
| 04 | [Monthly issuance task](04-monthly-issuance-task.md) | done | billing |
| 05 | [Boleto PDF (draft)](05-boleto-pdf-draft.md) | done | billing |
| 06 | [Billing plan screen](06-billing-plan-screen.md) | done | frontend |
| 07 | [Billing documents and runs screens](07-billing-documents-screens.md) | done | frontend |

## Notes
**External action on day 1:** create the Asaas sandbox account and API key. The company's bank account is not available for now, so a ready gateway replaces the direct Santander integration; production needs an account in the CNPJ of the company or of the condominium. Parts 03 to 05 need no account (draft mode).

**Before part 02:** the per-condominium late-payment rules (fine, interest rates, grace), the competence settings and the six ideal fractions per unit are specified in [spec 020](../../features/history.md); billing plan items will name a fraction number from 1 to 6.

## Closing checklist
- [x] Every part is `done` or `moved`
- [x] Docs of the affected apps updated
- [x] `known-gaps.md` rows closed (none was tied to this phase; the new gaps are recorded there)
- [x] Frontend client regenerated (if the API changed)
