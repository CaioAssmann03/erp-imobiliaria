---
summary: Phase 2a (Condominium workspace) of the roadmap — the condominium screen rebuilt as one workspace like the reference system's, section by section: goal, parts and status.
read-when: you plan or start work on the condominium workspace or on one of its sections (síndico, bank data, settings, documents...)
skip-if: you need the overall status of all phases → roadmap/README.md; you need one part → the numbered file in this folder; you need the registry endpoints and rules → apps/condominiums.md
---
# Phase 2a — Condominium workspace

**Status:** todo · **Source:** user request of 2026-10-22 (screenshots of the reference system's condominium web) · **Depends on:** phases 2 and 4

## Goal
One screen for the condominium registry, laid out like the reference system (Sami): the list of condominiums on the left, the sections of the selected one in the middle as read-only cards (a pencil on each card edits only that card), and the section menu on the right. Part 01 builds the screen with the data that exists today; the other parts add the sections and fields the reference has and we lack.

## Parts
<!-- One row per part file. The phase status is derived: all parts done/moved = done; any in-progress/done = in-progress. -->
| # | Part | Status | Apps |
|---|---|---|---|
| 01 | [Workspace screen](01-workspace-screen.md) | todo | condominiums, frontend |
| 02 | [Síndico and other roles](02-sindico-and-roles.md) | todo | condominiums, persons, frontend |
| 03 | [Bank data and settings](03-bank-data-and-settings.md) | todo | condominiums, billing, frontend |
| 04 | [Administration fee and billing extras](04-fee-and-billing-extras.md) | todo | condominiums, billing, frontend |
| 05 | [General data extras](05-general-data-extras.md) | todo | condominiums, persons, finance, frontend |
| 06 | [Documents and operation history](06-documents-and-history.md) | todo | condominiums, core, frontend |
| 07 | [Insurance and guarantee](07-insurance-and-guarantee.md) | todo | condominiums, frontend |

## Notes
- Decided by the user on 2026-10-22: one screen replaces the table and the edit page; a pencil on each card; the first section after the screen is the síndico; the **reading options** (gas, water and energy) are left out, because the administrator does not bill consumption through the system.
- Twelve screenshots were seen: general data, síndico, bank data, administration fee, reading options, billing data, documents and settings. Insurance, guarantee and the operation history were not shown, so part 07 waits for them (with the pencil open, to see the option lists).
- The prints show a real síndico's personal and bank data and a note with bank details: such values never go into docs, tests or seeds. The access codes (part 05) and the notes may hold passwords, so each needs a security decision before anything is stored.
- The pickers that list condominiums ask for one page of 100 while the administrator has more than 100 active condominiums: fix it apart from this phase (a picker with a server-side search).
- The sorting by column header (spec 037) keeps working through the API; the list on the left uses `?ordering=` for its own sort control.

## Closing checklist
- [ ] Every part is `done` or `moved`
- [ ] Docs of the affected apps updated
- [ ] `known-gaps.md` rows closed
- [ ] Frontend client regenerated (if the API changed)
