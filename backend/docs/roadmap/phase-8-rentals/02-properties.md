---
summary: Plan and status of part 02 of phase 8 — Properties and co-owners.
read-when: you work on properties and co-owners or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-8-rentals/README.md; you need the process → roadmap/README.md
---
# Part 02 — Properties and co-owners

**Status:** todo · **Phase:** 8 (Rentals) · **Apps:** rentals · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** none yet

## Goal
Properties with co-ownership and income split.

## Scope
- [ ] Models + API: `Property`, `PropertyOwner`

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| Imovel | `Property` | address, kind, purpose rent/sale/both, status, optional condominium/unit link |
| ImovelProprietario | `PropertyOwner` | owner (person, or a condominium) with income-split percentage and receipt day |

### Business rules
- Income-split percentages of one property sum to at most 100 (model `clean()`, like owner percentages on units).

### Open questions
- [ ] Can a condominium be an owner? The PDF shows it. (recommended: yes, nullable `owner_condominium` FK + exactly-one constraint)

## Result
Not started.
