---
summary: Plan and status of part 04 of phase 6 — Default agreements.
read-when: you work on default agreements or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-6-closings-and-agreements/README.md; you need the process → roadmap/README.md
---
# Part 04 — Default agreements

**Status:** todo · **Phase:** 6 (Closings and agreements) · **Apps:** billing · **Frontend impact:** new screens · **Depends on:** phase 5
**Spec:** none yet

## Goal
Negotiate an installment agreement for a defaulting unit or rental contract.

## Scope
- [ ] Model + API: `DefaultAgreement`
- [ ] Screen: installment negotiation for a defaulting unit

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| AcordoInadimplencia | `DefaultAgreement` | holder, original documents, total value, installments, status active/fully_paid/partially_paid/cancelled/problem, agreement date |

### Business rules
- None.

### Open questions
- [ ] Do agreement installments reuse `BillingDocument`? (recommended: yes, one document per installment linked to the agreement)

## Result
Not started.
