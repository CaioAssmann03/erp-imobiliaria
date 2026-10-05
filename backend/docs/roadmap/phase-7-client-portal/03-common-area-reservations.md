---
summary: Plan and status of part 03 of phase 7 — Common-area reservations.
read-when: you work on common-area reservations or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-7-client-portal/README.md; you need the process → roadmap/README.md
---
# Part 03 — Common-area reservations

**Status:** todo · **Phase:** 7 (Client portal) · **Apps:** condominiums, frontend · **Frontend impact:** new screens · **Depends on:** 01
**Spec:** none yet

## Goal
Reserve shared areas by shift.

## Scope
- [ ] Models + API: `CommonArea`, `ReservationShift`, `CommonAreaReservation`
- [ ] Screen: reservation

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| AreaComum | `CommonArea` | condominium, name, capacity |
| TurnoReserva | `ReservationShift` | weekday, start/end time |
| ReservaAreaComum | `CommonAreaReservation` | area, unit, shift, date, status |

### Business rules
- None.

### Open questions
- [ ] Overlap/double-booking constraint: unique (area, shift, date) for active reservations? (recommended: yes, partial unique constraint)

## Result
Not started.
