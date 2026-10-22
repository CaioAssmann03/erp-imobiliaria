---
summary: Plan and status of part 03 of phase 2a — the Dados bancários and Configurações sections of the condominium workspace.
read-when: you plan or build the bank data of a condominium or its settings switches (issuance, online client, current account events, reports, payables, invoice)
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; the gateway account of a condominium → features/030-gateway-accounts.md
---
# Part 03 — Bank data and settings

**Status:** todo · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, billing, frontend · **Frontend impact:** new screens · **Depends on:** part 01
**Spec:** none yet

## Goal
The two sections of the reference system that hold how the condominium receives money and which behaviors are on: Dados bancários and Configurações.

## Scope
- [ ] Dados bancários: the condominium has its own account (yes or no), the account that issues its boletos, the condominium's bank, agency and account, and the savings balance held outside the administrator
- [ ] Configurações: issue billing (on or off), online client (two switches), the events posted to the current account (bank fee, fine, interest, content insurance), statements and reports (two switches), the non-liability lock (lawyer), accounts payable (two switches and the limit), the invoice (use the general ZIP code)

## Draft for the spec
### Entities
| Reference | Code name | Notes |
|---|---|---|
| Conta própria, conta do condomínio, poupança | fields or a record of the condominium (proposal) | bank, agency, account, balance outside the administrator |
| Chaves de Configurações | fields of the condominium (proposal) | one boolean each; the limit is a type and a value |

### Business rules
- A switch is stored first; it only changes behavior when something reads it. The ones with a consumer today: issue billing (the monthly issuance) and the payables limit.

### Open questions
- [ ] How does "account for issuing boletos" relate to the gateway sub-account of the condominium (spec 030)? (recommended: show the gateway account status there and keep the bank fields for the condominium's own account)
- [ ] Which switches must act now and which are only stored? (recommended: only issue billing and the payables limit act)
- [ ] Is the limit of accounts payable the existing `credit_limit`? (recommended: ask the user what `credit_limit` is for before reusing it)

## Result
