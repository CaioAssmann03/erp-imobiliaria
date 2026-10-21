---
summary: Plan and status of part 03 of phase 4 — Billing documents.
read-when: you work on billing documents or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 03 — Billing documents

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** -
**Spec:** [025 — Billing documents](../../features/history.md) (section 025)

## Goal
The boleto as a business record with its composition by cost center.

## Scope
- [x] Models + API: `BillingDocument`, `BillingDocumentItem`

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-21 (spec 025): `BillingDocument` and `BillingDocumentItem` in `billing`, `create_billing_document` / `cancel_billing_document` services, read-only `/api/billing-documents/` with cancel, Admin, audit, client regenerated. The monthly issuance (part 04) is the only caller of the create service and decides who the payer is.
