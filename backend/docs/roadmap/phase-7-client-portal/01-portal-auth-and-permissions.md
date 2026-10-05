---
summary: Plan and status of part 01 of phase 7 — Portal authentication and permissions.
read-when: you work on portal authentication and permissions or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-7-client-portal/README.md; you need the process → roadmap/README.md
---
# Part 01 — Portal authentication and permissions

**Status:** todo · **Phase:** 7 (Client portal) · **Apps:** accounts, condominiums · **Frontend impact:** new screens · **Depends on:** phase 3
**Spec:** none yet

## Goal
Same user base, different profile; a customer sees only their own units and condominiums.

## Scope
- [ ] Link `User` to `Person` (profile: staff / owner / tenant / syndic)
- [ ] Object-level permissions (django-guardian or queryset scoping) via `UnitPerson`
- [ ] Portal password stored only as a hash, never visible
- [ ] `portal_blocked` flag and portal login screen

## Draft for the spec
Seed material from the project PDFs. When the spec is written, move this content into it and replace this section with the line `Moved to the spec.`

### Entities
None new.

### Business rules
- The reference system stores portal passwords in plain text; the new one must never.
- Consent for WhatsApp messaging is recorded on `Person` (LGPD).

### Open questions
- [ ] django-guardian or plain queryset scoping through `UnitPerson`? (recommended: queryset scoping first; fewer moving parts)
- [ ] Portal under the same Next.js app as route group `(portal)`? (recommended: yes, as in the stack PDF)

## Result
Not started.
