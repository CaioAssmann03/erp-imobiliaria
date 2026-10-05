---
summary: Plan and status of part 04 of phase 4 — Monthly issuance task.
read-when: you work on monthly issuance task or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 04 — Monthly issuance task

**Status:** todo · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 02, 03
**Spec:** none yet

## Goal
Run a plan for a month: one document + items per unit.

## Scope
- [ ] Celery task: monthly calculation (fixed or ideal-fraction share)
- [ ] Beat schedule with a configurable day per condominium
- [ ] Idempotency: running twice for the same month creates no duplicates

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- Uses `BillingRules` (due day, early-payment discount, credit limit) and skips the syndic unit when exempt (`is_syndic_unit`).

### Open questions
- [ ] Dedicated `BillingRun` record to audit each run? (recommended: yes, small model with status and counts)

## Result
Not started.
