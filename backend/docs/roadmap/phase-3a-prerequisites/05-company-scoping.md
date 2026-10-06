---
summary: Plan and status of part 05 of phase 3a — Company scoping.
read-when: you work on company scoping before the finance phase, or need to know whether it is done
skip-if: you need the whole phase → roadmap/phase-3a-prerequisites/README.md; you need the process → roadmap/README.md
---
# Part 05 — Company scoping

**Status:** done · **Phase:** 3a (Prerequisites for phase 3) · **Apps:** accounts, core, persons, condominiums, finance · **Frontend impact:** client regeneration · **Depends on:** 02
**Spec:** [004 — Company scoping](../../features/history.md) (section 004)

## Goal
Every logged-in user sees only the data of their company, before any money model exists. Roles come in phase 7. Decided in gap #2.

## Scope
- [x] `User.company` and the rule for users without one
- [x] One queryset mixin in `core` that filters every viewset by `request.user.company`, and sets the company on create
- [x] Scope the dashboard, the global search, the admin and `seed_demo`
- [x] Isolation tests for every endpoint (another company's ids return 404, lists never leak)
- [x] Update `architecture/quality.md`, `apps/accounts.md`, `apps/core.md`; delete gap #2

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 004 `done`). `apps/core/scoping.py` holds the single decision (`scope_to_company`, superuser bypass) and its three adapters; every model declares `company_lookup`; `User.company`, `Person.company` and the denormalized `company` on the person documents are required, with CPF/CNPJ/RG unique per company; the same-company rules are model `clean()`s; the viewsets, relation fields, admins, dashboard, search and `/api/companies/` follow the scope.
Migrations: `accounts.0002/0003` and `persons.0002/0003` (nullable + backfill, then required + constraints); verified on a scratch database with existing users, people and documents (all got the only company).
Checked: `pytest apps -q` 280 passed, `mypy apps config` clean, frontend `tsc`, `eslint` and `build` clean with the regenerated client; the condominium form no longer shows or sends the company.
Deviations to confirm with the user (recorded in the spec's Decisions): `rg` is unique per company too; duplicate documents in one company are now a non-field 400 (it comes from a constraint); the seed and the test suite use the migration-seeded company (`core.testing.seeded_company`).
**Needs a manual step:** local databases that applied the old history must be recreated (`docker compose down -v && docker compose up -d`, then `migrate`).
