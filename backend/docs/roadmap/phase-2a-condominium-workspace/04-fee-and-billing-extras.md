---
summary: Plan and status of part 04 of phase 2a — the extras of the Taxa de administração and Dados de cobrança sections: index catalog, extra fee, provisioning, office-supplies fee, monetary correction and the boleto messages.
read-when: you plan or build the extra fee options, the index catalog, the monetary correction or the messages and customization of the boleto
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; the rules that exist today → apps/condominiums.md
---
# Part 04 — Administration fee and billing extras

**Status:** todo · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, billing, frontend · **Frontend impact:** new screens · **Depends on:** part 01
**Spec:** none yet

## Goal
The fee and billing options the reference system has beyond what we store today.

## Scope
- [ ] Taxa de administração: the adjustment index as a catalog with a code ("0001 - IGPM"), the extra fee, the provisioning linked to the fee, the office-supplies fee (type and percentage over the fee) and how the interest is itemized (by sub-account)
- [ ] Dados de cobrança: the monetary correction, the boleto customization mode and the eight boleto messages (messages 1 to 3, collection instructions, late unit, unit with content insurance, payment place, receipt place without bank fee)
- [ ] The boleto PDF prints the messages

## Draft for the spec
### Entities
| Reference | Code name | Notes |
|---|---|---|
| Índice de reajuste | catalog of indexes (proposal) | code, name; replaces the free text of `adjustment_index` |
| Mensagens nos boletos | fields of `BillingRules` (proposal) | text fields; copied to the document at issuance like the late-payment terms |

### Business rules
- A document copies the messages in force at issuance (a later edit does not rewrite an issued boleto).

### Open questions
- [ ] Which messages does the gateway's boleto accept, and which only the PDF prints? (recommended: all on the PDF, those the gateway accepts also there)
- [ ] The monetary correction: which index and when does it start? (recommended: ask the user for the rule)

## Result
