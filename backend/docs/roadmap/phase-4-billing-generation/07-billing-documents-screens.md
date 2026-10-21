---
summary: Plan and status of part 07 of phase 4 — Billing documents and runs screens (frontend).
read-when: you work on the screens that list billing documents, trigger and read issuance runs, or download the draft PDF
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the plan screen → roadmap/phase-4-billing-generation/06-billing-plan-screen.md
---
# Part 07 — Billing documents and runs screens

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** frontend · **Frontend impact:** new screens · **Depends on:** 03, 04, 05, 06
**Spec:** [029 — Billing documents and runs screens](../../features/history.md) (section 029)

## Goal
Let staff see the issued documents, issue a condominium's month by hand, read what a run did and download the draft PDF, without the API docs or the Django Admin. Added on 2026-10-21 while specifying part 06 (decision of the user).

## Scope
- [x] Screen: billing documents list (filters: condominium, status, reference month, overdue, search by unit or payer) and the document page with items
- [x] Action: cancel a document; generate and download its draft PDF
- [x] Screen: issuance runs (list, page with counts and explained problems) and the action to issue a condominium's month (`POST /api/billing-runs/`)
- [x] Sibling tabs of **Planos de cobrança** in the **Cobrança** group (spec 028)

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-21 (spec 029): **Documentos** and **Execuções** screens, the **Emitir mês** dialog, the PDF and cancel actions, and the Portuguese texts and fix links of a run's problems; the run API now names the unit of each problem. Not exercised in a browser yet (manual run pending).
