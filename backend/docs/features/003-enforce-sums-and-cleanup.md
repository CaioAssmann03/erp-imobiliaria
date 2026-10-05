---
summary: Spec: enforce the unit apportionment cap and the owners' percentage cap in the models, remove the SQLite settings fallback, clean unused imports.
read-when: you touch ideal_fraction / ownership_percentage rules, database settings or want the reasoning behind the sum caps
skip-if: you need the general rule placement → practices.md; you need the formulas → architecture/data/domain-rules.md
---
# 003 — Enforce sum caps, drop the SQLite fallback, clean imports

**Status:** done · **Apps:** condominiums, config (settings), financeiro, stub apps · **Frontend impact:** none (new 400 messages on existing fields)

## Open questions
(none) — decisions below were taken by the agent from the request ("implement the rules, the fallback, the imports"); each is reversible and listed so the user can overrule.

## R — Requirements
- [x] Unit `ideal_fraction`: the **active units of a condominium cannot sum more than 1**. Reaching exactly 1 stays a *pendency* (dashboard), because units are created one by one.
- [x] Owners: at no date may the owner links of a unit sum more than 100 %. Historical (non-overlapping) owners are allowed.
- [x] The project requires PostgreSQL: remove the silent SQLite fallback; fail fast with a clear message when `POSTGRES_DB` is missing.
- [x] No unused imports in the app stubs.

## E — Entities
| Entity | Change |
|---|---|
| `Unit` | `clean()` also checks the cap: sum of the other active units' `ideal_fraction` + this ≤ `APPORTIONMENT_TOTAL + APPORTIONMENT_TOLERANCE` (only when this unit is active and has a fraction). Error on `ideal_fraction`. |
| `UnitPerson` | `clean()` also checks owners: for every start date among the unit's owner links (this one included) the concurrent sum ≤ 100. Error on `ownership_percentage`. |
No schema change, no migration.

## A — Approach
- Rules in the models (`clean()`), as per `practices.md` §2; serializers and the admin get them through `full_clean()`.
- Cap instead of equality for the apportionment: equality cannot hold while units are being registered; the dashboard keeps reporting condominiums that do not sum to 1.
- Owners use an interval sweep (concurrent sum at each start date), so a past owner (ended link) does not block a new owner.
- Known limit: `clean()` reads the database before saving, so two simultaneous writes can both pass (no row locking). Acceptable for the current admin-only usage.
- SQLite fallback removed instead of guarded: the schema (trigram indexes, `pg_trgm`) cannot run there.

## S — Structure
`apps/condominiums/models/unit.py`, `apps/condominiums/models/unit_person.py`, `config/settings.py`; stub cleanup in `apps/{cobranca,locacoes,vendas,financeiro}`; tests in `apps/condominiums/tests/`; docs.

## O — Operations
1. Spec. 2. Model rules. 3. Settings. 4. Imports. 5. Tests. 6. Docs (`domain-rules`, `known-gaps`, `overview`, `local-dev`, `testing`).

## N — Norms
Rules in models only; messages in English identical in code and docs; one error key per field.

## S — Safeguards
Direct ORM writes (`seed_demo`, shell) bypass `clean()` and can break the caps (known-gaps #21); the dashboard still reports apportionment ≠ 1. Concurrency limit above.

## Test plan
- Apportionment: sum over 1 rejected; exactly 1 accepted; inactive units ignored; updating a unit excludes itself.
- Owners: two owners 60 + 50 overlapping rejected; 60 + 40 accepted; a past owner (ended) + new owner 100 accepted; tenants ignored.
- API: both violations answer 400 on the right field.
- Settings: missing `POSTGRES_DB` raises `ImproperlyConfigured`.

## Docs updated
`domain-rules.md`, `known-gaps.md`, `foundation/overview.md`, `operations/local-dev.md`, `quality/testing.md`, `features/README.md`.
