---
summary: Plan and status of part 01 of phase 5 — Santander registration.
read-when: you work on santander registration or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 01 — Santander registration

**Status:** todo · **Phase:** 5 (Billing issuance (bank)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** phase 4
**Spec:** none yet

## Goal
Register the title in real time and receive barcode, digitable line and Pix payload (hybrid boleto).

## Scope
- [ ] `httpx` client for the Santander Collection API (OAuth + certificate)
- [ ] Celery task: register after each issuance
- [ ] Retry/backoff and error recording
- [ ] QR code image from the Pix payload

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- [ ] Sandbox available before production credentials? (recommended: ask the bank; build the client against a fake first)

## Result
Not started.
