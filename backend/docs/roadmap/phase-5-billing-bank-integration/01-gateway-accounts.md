---
summary: Plan and status of part 01 of phase 5 — the company's single Asaas account, with the credentials kept encrypted.
read-when: you work on the gateway accounts, their credentials or the onboarding of a condominium at Asaas
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 01 — Gateway account

**Status:** in-progress · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** client regeneration · **Depends on:** phase 4
**Spec:** [037](../../features/037-single-gateway-account.md) (one Asaas account per company); [030](../../features/030-gateway-accounts.md) (the sub-account per condominium it replaced, dropped)

## Goal
The company has one account at the gateway that issues the boletos of every condominium and receives the money, and the system holds its credentials safely. Condominiums have no account and no CNPJ requirement; the split between current account, reserve fund and works fund exists only in the ledger.

## Scope
- [x] Model `GatewayAccount` (company, API key and webhook token stored encrypted, status `pending` / `active` / `blocked`) and its read-only Admin
- [x] Set-up command `setup_gateway_account` (key by prompt, webhook token generated, optional webhook registration, token rotation)
- [x] Encryption key for the stored credentials in the environment (`GATEWAY_CREDENTIALS_KEY`), recorded in `.env.example` and `architecture/overview.md`
- [x] The sub-account onboarding and status sync of spec 030 are removed; the migration moves an existing account to its condominium's company
- [ ] Validate in the Asaas sandbox with the CPF account: key check, webhook registration, a charge, the confirmed payment and the postings (spec 037, *Pending before done*)
- [ ] Register a Pix key at the account so the boleto shows a durable Pix QR (`POST /pix/addressKeys` type `EVP` works in the sandbox)
- [ ] External: decide whether the production account is CPF or CNPJ (the user keeps CPF for now) and confirm with Asaas that collecting on the administradora's own account for the condominiums is allowed

## Result
Implemented on 2026-10-26 (spec 037). The spec stays `in-progress` until the sandbox validation above is done.
