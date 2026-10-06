---
summary: Plan and status of part 03 of phase 4 — Billing documents.
read-when: you work on billing documents or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 03 — Billing documents

**Status:** todo · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
The boleto as a business record with its composition by cost center.

## Scope
- [ ] Models + API: `BillingDocument`, `BillingDocumentItem`

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| DocumentoCobranca | `BillingDocument` | origin (unit / rental contract / sale installment), payer person, competence, original value, due date, status issued/registered/paid/overdue/cancelled, fine/interest/discount |
| DocumentoCobrancaItem | `BillingDocumentItem` | description, cost center, value; sum of items = document value |

### Business rules
- Bank fields (`our_number`, digitable line, barcode) do NOT live here; they change on every reissue (phase 5 part 02).
- Payer defaults per the "sends document to" setting (owner or tenant).

### Open questions
- [ ] Same polymorphic origin question as phase 3 (recommended: nullable FKs + `CheckConstraint`).

## Result
Not started.
