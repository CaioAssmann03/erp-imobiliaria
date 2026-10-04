---
summary: 16 one-line architectural decisions with reason and consequence.
read-when: you wonder why something is built this way or want to change a foundation
skip-if: how to do something → practices.md
---
# Decisions

One line each: decision → reason → consequence. Changing one needs a feature spec.

| # | Decision | Why | Consequence |
|---|---|---|---|
| 1 | UUID primary keys on every model | opaque ids, safe to expose, mergeable data | `DEFAULT_AUTO_FIELD` is irrelevant; ids are strings in the API |
| 2 | English code and API names; Portuguese only in UI/sample data | consistency; the generated client needs no translation | API errors are English; the frontend translates |
| 3 | Apps are packages (`models/`, `serializers/`, `views/`), one entity per file | small files, easy navigation, AI-friendly | re-export in `__init__.py`; empty stub apps still use the old layout |
| 4 | 1:1 parts (address, contract, billing, person documents) are written through the parent serializer | one request per screen; atomic | `create`/`update` pop nested data in `transaction.atomic` |
| 5 | Child collections (unit people) have their own endpoint | they change independently and are many | parent exposes them read-only |
| 6 | Rules live in model constraints **and** serializers | DRF does not run `CheckConstraint`; API must answer 400 | every rule is written twice and tested twice |
| 7 | PostgreSQL only (trigram search) | fast `icontains`-style search on names/e-mails | tests and dev need Postgres; SQLite fallback is not viable |
| 8 | Documents stored digits-only | one canonical form; simple equality/prefix search | masks are UI-only |
| 9 | `accounts.User` is separate from `persons.Person` | login ≠ business entity; most people never log in | a future `Person.user` 1:1 lives in `persons` |
| 10 | Search param `?query=`, pagination `?page=&limit=` | one consistent contract for all lists | `QuerySearchFilter`, `StandardPagination` in `core` |
| 11 | OpenAPI is the contract; the frontend client is generated | no drift between backend and frontend | every API change must be followed by client regeneration |
| 12 | `Company` exists from the start (multi-company) | the business may administer for several companies | no scoping yet (known-gaps.md #2) |
| 13 | `Unit.block` uses `RESTRICT`, condominium delete cascades | protect blocks with units, but allow deleting a whole condominium | |
| 14 | Migration history reset to one `0001` per app before production | model refactor happened before any real data | see operations.md warning |
| 15 | Spec-first workflow for features; ask on any gap | avoid rework and silent assumptions | `docs/features/` is mandatory for features |
| 16 | Celery/Redis provisioned but unused | jobs (boleto, mail) are coming | no tasks, workers disabled on the free plan |
