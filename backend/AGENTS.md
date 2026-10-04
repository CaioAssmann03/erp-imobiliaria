# Backend index

Django 6 + Django REST Framework + PostgreSQL + Celery/Redis. ERP for a condominium administration company.
This file is only the **index**; knowledge lives in [`docs/`](docs/README.md).

## How to work

1. **Do not explore the project on your own** (no folder listing, no code search, no inferring conventions from existing files).
2. **Read headers first**: every doc starts with a 5-line header (`summary`, `read-when`, `skip-if`); read only its first 6 lines to decide, and follow `skip-if` redirects instead of reading further (see the root `AGENTS.md`).
3. Open [`docs/README.md`](docs/README.md), find your task in its **Task → files** table, read **only those files** (usually 2–3).
4. Read source files only when a doc gives the path or you are already changing that file.
5. **Any doubt, ambiguity or gap you find — in the request, the docs or the code — you must ask the user before going on.**
   Do not guess, do not pick a default silently. Ask short, concrete questions (with your recommended answer), then record the
   answer in the right doc.
6. **Before any feature, write a feature spec first**, then implement it:
   - create `docs/features/NNN-<slug>.md` from [`docs/features/_template.md`](docs/features/_template.md) (process in
     [`docs/features/README.md`](docs/features/README.md));
   - resolve every open question with the user; implement only when the spec has no open questions;
   - after implementing, update the spec status and the docs of the affected apps.
   Bug fixes and small refactors that change no behavior do not need a spec; say so when you skip it.
7. Changed something a doc describes? **Update that doc in the same change.**

## Always true

- Code, comments and docs in English. API field names are English; user-facing Portuguese texts belong to the frontend.
- Every model: UUID primary key, `created_at`/`updated_at`, `@final`, constraints that mirror the business rules.
- DRF does not enforce `CheckConstraint`s: mirror each rule in the serializer `validate` so the API returns 400, not 500.
- App layout is packages (`models/`, `serializers/`, `views/`), one entity per file. Never edit migrations already applied; add new ones.
- Tests live in each app's `tests/`; they need PostgreSQL (trigram indexes). Run `pytest` before finishing.
- The OpenAPI schema is the contract with the frontend: after API changes, tell the user the client must be regenerated.

## Map

| Area | Docs |
|---|---|
| Product and stack | [architecture/foundation/product-context.md](docs/architecture/foundation/product-context.md) · [architecture/foundation/overview.md](docs/architecture/foundation/overview.md) |
| How an app is built | [architecture/structure/app-anatomy.md](docs/architecture/structure/app-anatomy.md) · [practices.md](docs/practices.md) |
| API rules | [architecture/api/api-conventions.md](docs/architecture/api/api-conventions.md) |
| Data | [architecture/data/data-model.md](docs/architecture/data/data-model.md) |
| Testing · local commands | [architecture/quality/testing.md](docs/architecture/quality/testing.md) · [architecture/operations/local-dev.md](docs/architecture/operations/local-dev.md) |
| Security · personal data | [architecture/quality/security.md](docs/architecture/quality/security.md) |
| Deploy · production · runbook | [architecture/operations/operations.md](docs/architecture/operations/operations.md) |
| Business rules and formulas | [architecture/data/domain-rules.md](docs/architecture/data/domain-rules.md) |
| Why it is built this way | [architecture/foundation/decisions.md](docs/architecture/foundation/decisions.md) |
| Doing X in the future | [architecture/structure/extending.md](docs/architecture/structure/extending.md) |
| Each app | [apps/](docs/apps/) — `accounts`, `core`, `persons`, `condominiums`, `financeiro` (apps with no code yet get their doc when they start) |
| New feature process | [features/README.md](docs/features/README.md) |
| Known gaps | [known-gaps.md](docs/known-gaps.md) |
