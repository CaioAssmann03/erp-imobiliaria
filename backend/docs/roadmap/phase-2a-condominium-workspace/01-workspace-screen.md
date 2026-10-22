---
summary: Plan and status of part 01 of phase 2a — the condominium screen as one workspace (list, section cards with a pencil, section menu) with the data that exists today.
read-when: you work on the layout of the condominium screen, its list on the left, the section menu or the card editing
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; the contract and the decisions → features/038-condominium-workspace.md
---
# Part 01 — Workspace screen

**Status:** in-progress · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, frontend · **Frontend impact:** new screens · **Depends on:** phase 2, phase 4
**Spec:** [038](../../features/038-condominium-workspace.md)

## Goal
The condominium screen becomes the reference system's workspace, with the data we already have: the list of condominiums on the left, the sections of the selected one in the middle as read-only cards (a pencil on each card edits only that card) and the section menu on the right.

## Scope
- [x] The condominiums list carries `unit_count`
- [x] The list on the left: code and name, units, search by name or code, jump by code, hide inactive, sort, filter, endless loading and the total
- [x] The section menu on the right, following the scroll
- [ ] Cards with a pencil (Dados gerais, Taxa de administração, Dados de cobrança, Configurações)
- [x] The table and the edit page leave; the creation page keeps the form
- [x] The layout on a phone

## Draft for the spec
Moved to the spec.

## Result
First PR: the list, the menu and the phone layout around the existing form (the sections are still one form; the menu scrolls to them). Second PR: the cards with a pencil.
