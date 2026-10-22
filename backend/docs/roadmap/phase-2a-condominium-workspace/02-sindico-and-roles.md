---
summary: Plan and status of part 02 of phase 2a — the síndico, subsíndico, representante, zelador and conselho consultivo of a condominium, with their term, exemption, remuneration and the person's data.
read-when: you plan or build the Síndico section, the roles of a condominium or the extra data of a person (contacts, address, bank, PIX, documents)
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; you need the people module → apps/persons.md
---
# Part 02 — Síndico and other roles

**Status:** todo · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, persons, frontend · **Frontend impact:** new screens · **Depends on:** part 01
**Spec:** none yet

## Goal
Each condominium has its síndico and the other roles of the reference system (subsíndico, representante, zelador, conselho consultivo), each with the person's data, the term and, for the síndico, the exemption and remuneration.

## Scope
- [ ] Roles of a condominium with a start and an end date; one active síndico at a time
- [ ] The síndico's exemption and remuneration; the issuance's `exempts_manager_unit` reads who is the síndico's unit
- [ ] The person's data the reference shows: contacts (e-mail, mobile, home and business phone), address with map, bank account and PIX keys, profession and approximate income, identity document, issuing agency and PIS, marital status, spouse, parents and birthplace
- [ ] The Síndico section: a tab per role and the cards (personal data, exemption and remuneration, term, contacts, address, bank, PIX, professional, documents, complementary)

## Draft for the spec
### Entities
| Reference | Code name | Notes |
|---|---|---|
| Síndico, subsíndico... | `CondominiumRole` (proposal) | condominium, person, role, start and end date; the síndico also has the exemption type and the remuneration |
| Person data | extra fields or child records of `Person` (proposal) | contacts, address, bank account, PIX keys, profession and income, document numbers, family |

### Business rules
- One active síndico per condominium at any date; the other roles may have several people.
- The personal and bank data of a person is sensitive: masked in the audit log (like payment data).

### Open questions
- [ ] The exemption types (the print with the pencil open shows the list) (recommended: ask the user for it)
- [ ] Is every role held by a registered `Person` or can the zelador be a typed name? (recommended: always a `Person`)
- [ ] Which unit is the síndico's, for the exemption? (recommended: an explicit unit on the role)
- [ ] Who may see the personal and bank data? (recommended: administrators only, for now)

## Result
