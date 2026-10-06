---
summary: Phase 5 (Billing issuance (bank)) of the roadmap — goal, parts and status.
read-when: you plan or start work belonging to phase 5: billing issuance (bank)
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder
---
# Phase 5 — Billing issuance (bank)

**Status:** todo · **Source:** Sprint 5 of the sprints PDF · **Depends on:** phase 4

## Goal
Register boletos at the bank, reissue overdue ones, reconcile payments and deliver by e-mail.

## Parts
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Santander registration](01-santander-registration.md) | todo | billing |
| 02 | [Bank registration records](02-bank-registration-records.md) | todo | billing |
| 03 | [Overdue check and reissue](03-overdue-reissue-task.md) | todo | billing |
| 04 | [Daily reconciliation](04-daily-reconciliation.md) | todo | billing, finance |
| 05 | [E-mail delivery](05-email-delivery.md) | todo | billing |

## Notes
Starts for real only when the accreditation requested in phase 4 has returned from the bank.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
