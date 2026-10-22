---
summary: Plan and status of part 05 of phase 2a — the extras of the Dados gerais section: tags, notes with author, suppliers of the condominium, invoice data, access codes and the unit summaries.
read-when: you plan or build tags, notes, the suppliers of a condominium, the access codes or the extra identification data
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; you need the finance suppliers → apps/finance.md
---
# Part 05 — General data extras

**Status:** todo · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, persons, finance, frontend · **Frontend impact:** new screens · **Depends on:** part 01
**Spec:** none yet

## Goal
The cards of Dados gerais that the reference system has and we lack.

## Scope
- [ ] Etiquetas: tags linked to a condominium
- [ ] Informações adicionais: name for the invoice, CEI and the date of the habite-se (the municipal registration already exists)
- [ ] Códigos de acesso: INSS, Receita Federal and Municipal
- [ ] Fornecedores do condomínio: the suppliers a condominium uses, with what each provides
- [ ] Observações: notes with author, date and a title
- [ ] The summary of the units by type and the fractions table with the number of units

## Draft for the spec
### Entities
| Reference | Code name | Notes |
|---|---|---|
| Etiqueta | `Tag` and its links (proposal) | name, color; many to many with the condominium |
| Observação | `CondominiumNote` (proposal) | condominium, author, title, text |
| Fornecedor do condomínio | link between `Supplier` and `Condominium` (proposal) | what it provides |
| Códigos de acesso | fields of the condominium (proposal) | three secrets |

### Business rules
- The access codes and the notes can hold passwords: they are never written in the audit log in clear, and the notes are not a password vault.

### Open questions
- [ ] How are the access codes stored? (recommended: encrypted at rest, masked on screen with a reveal for administrators, never in the audit diff)
- [ ] Can a note be marked sensitive and then masked? (recommended: yes)

## Result
