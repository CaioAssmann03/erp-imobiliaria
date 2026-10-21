---
summary: Plan and status of part 01 of phase 4 — Asaas gateway account and credentials (external action).
read-when: you work on the payment gateway account (external action) or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 01 — Payment gateway account (Asaas, external action)

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** - · **Frontend impact:** none · **Depends on:** -
**Spec:** none yet

## Goal
Get a payment gateway (Asaas) account and API credentials so phase 5 is not blocked. Decision: a ready gateway replaces the direct Santander integration, because the company's bank account is not available for now.

## Scope
- [x] Create the Asaas **sandbox** account and API key (development and homologation, no real money)
- [x] Record env var names (`ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_TOKEN`) in `.env.example` and `architecture/overview.md`
- [x] Production account and fee comparison — moved to [phase 5 part 01](../phase-5-billing-bank-integration/01-gateway-accounts.md), where they block going live

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- None.

### Open questions
- None (the production questions moved to phase 5 part 01).

## Result
Done on 2026-10-21: Asaas sandbox account and API key working (checked with a read call to the sandbox API); `ASAAS_API_KEY`, `ASAAS_BASE_URL` and `ASAAS_WEBHOOK_TOKEN` in `.env.example` and `architecture/overview.md`. The company's bank account is not available for now, so a ready gateway replaces the direct Santander integration. The production account (CNPJ of the company or of each condominium) and the fee comparison moved to phase 5 part 01.
