---
summary: Plan and status of part 01 of phase 5 — Asaas production account and one sub-account per condominium, with the credentials kept encrypted.
read-when: you work on the gateway accounts, their credentials or the onboarding of a condominium at Asaas
skip-if: you need the whole phase → roadmap/phase-5-billing-bank-integration/README.md; you need the process → roadmap/README.md
---
# Part 01 — Gateway accounts

**Status:** todo · **Phase:** 5 (Billing issuance (gateway)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** phase 4
**Spec:** none yet

## Goal
Every condominium that is billed has an account at the gateway that is the beneficiary of its boletos, and the system holds the credentials to use it safely.

## Scope
- [ ] External: open the Asaas production account in the CNPJ of the company (never a personal account); compare the per-charge fee with the old convenio before opening it
- [ ] Model `GatewayAccount` (condominium, gateway wallet id, API key stored encrypted, status `pending` / `active` / `blocked`) and its Admin
- [ ] Onboarding of a condominium: create its Asaas sub-account (its CNPJ, address and the data Asaas requires) and store the credentials the response gives once
- [ ] Encryption key for the stored API keys in the environment (`GATEWAY_CREDENTIALS_KEY`), recorded in `.env.example` and `architecture/overview.md`

## Draft for the spec
### Entities
| Name | Code name | Notes |
|---|---|---|
| Conta no gateway | `GatewayAccount` | one per condominium; the API key is shown by Asaas only once and must be stored encrypted; never returned by the API |

### Business rules
- A condominium without an active `GatewayAccount` cannot have charges registered; its documents stay as drafts and the issuance reports it.
- Each sub-account has its own webhook (the `webhooks` field of the creation request configures it), authenticated by its own `authToken`; the token is shown once and stored like the API key.
- The credentials never appear in logs, the API, the Admin list or an error message.

### Open questions
- [ ] **Blocker:** how does the money reach each condominium? The Asaas documentation limits the first production sub-accounts to 10, R$ 2,000.00 in charges each and 60 days, then blocks charges until Asaas reviews the operation, and keeps sub-account API keys only under BaaS or for sub-accounts sharing the parent's CNPJ prefix. (decision 1 of the phase; recommended: ask Asaas in writing whether unrelated condominium CNPJs can be onboarded under BaaS or a negotiated homologation, with limits and fees, **before** writing this spec)
- [ ] Who opens and owns the production account on the client side? (recommended: the company's finance contact; track the date here)
- [ ] A lost key is reissued through the parent account (`POST /v3/accounts/{id}/accessTokens`, which needs the IP whitelist and a setting enabled in the web UI): does the production host have a fixed IP? (check the VPS)
- [ ] Encrypt the API keys with a symmetric key from the environment (Fernet), or keep them only in the environment per condominium? (recommended: encrypted in the database; the environment holds one key)

## Result
Not started.
