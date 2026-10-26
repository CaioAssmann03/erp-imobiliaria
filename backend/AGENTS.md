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
6. **Before any feature, write a feature spec first**, then implement it. Planned work is in the **roadmap**: open
   [`docs/roadmap/README.md`](docs/roadmap/README.md), pick the next `todo` part (respect *Depends on*), answer its *Open questions*, then:
   - create `docs/features/NNN-<slug>.md` from [`docs/features/_template.md`](docs/features/_template.md) (process in
     [`docs/features/README.md`](docs/features/README.md));
   - resolve every open question with the user; implement only when the spec has no open questions;
   - link the spec in the roadmap part; after implementing, update the spec status, the docs of the affected apps, the part (`Status`, scope checklist, *Result*) and the phase table in the roadmap.
   Bug fixes and small refactors that change no behavior do not need a spec; say so when you skip it.
7. Changed something a doc describes? **Update that doc in the same change.**

## Always true

- Code, comments and docs in English. Comments only where the code cannot explain itself (a reason, a constraint, a format): see `docs/conventions/practices.md` §9. API field names are English; user-facing Portuguese texts belong to the frontend.
- Every model: UUID primary key, `created_at`/`updated_at`, `@final`: inherit `BaseModel` (all three; `apps/core/models/base.py`) or `UUIDModel` (the id only, for a model that has no timestamps), never repeat those fields.
- **A use case that orchestrates several models or a transaction is a service**: `apps/<app>/services/<use_case>.py`, one file per use case, a function named like the file. Services and serializers call it; it holds **no** business rule (see `docs/conventions/practices.md` §3b). Plain CRUD stays in the serializer.
- **Business rules live ONLY in the models**: field validators (one field), `clean()` (several fields or models; with 2+ rules it calls a `models/rules/<entity>.py` class), constraints (database guard). Serializers, views and
  services hold no business rule: serializers inherit `ModelRulesMixin` (it runs the model's rules and returns a 400). See `docs/conventions/practices.md` §2.
- **Names follow Clean Code** (`docs/conventions/naming.md`): intention-revealing, no abbreviations or one-letter names, verbs for methods, `is_/has_/should_` for booleans, `reference_date` (not `on`), named constants,
  no flag arguments, ≤ 3 parameters. Read it before naming anything; contracts (API fields, columns) are renamed only through a spec.
- App layout is packages (`models/`, `serializers/`, `views/`), one entity per file. Never edit migrations already applied; add new ones.
- Tests live in each app's `tests/`; they need PostgreSQL (trigram indexes). Run `pytest` before finishing.
- The OpenAPI schema is the contract with the frontend: after API changes, tell the user the client must be regenerated.

## Map

| Area | Docs |
|---|---|
| **Where the last session stopped** (branches, PRs, specs in flight, what waits on the user) | [roadmap/current-state.md](docs/roadmap/current-state.md) |
| **Roadmap: what is done, what is next** (8 phases, parts, status, backlog) | [roadmap/README.md](docs/roadmap/README.md) |
| **How the administradora really works** (one gateway account, items and sub-contas on a boleto, the registration fee) | [architecture/business-model.md](docs/architecture/business-model.md) |
| Product, stack, vocabulary, decisions | [architecture/overview.md](docs/architecture/overview.md) |
| How an app is built · recurring recipes | [architecture/structure.md](docs/architecture/structure.md) · [conventions/practices.md](docs/conventions/practices.md) |
| Naming (Clean Code) | [conventions/naming.md](docs/conventions/naming.md) |
| API rules | [architecture/api.md](docs/architecture/api.md) |
| Data | [architecture/data.md](docs/architecture/data.md) |
| Testing · local commands | [architecture/quality.md](docs/architecture/quality.md) · [architecture/operations.md](docs/architecture/operations.md) |
| Security · personal data | [architecture/quality.md](docs/architecture/quality.md) |
| Deploy · production · runbook | [architecture/operations.md](docs/architecture/operations.md) |
| Business rules and formulas | [architecture/data.md](docs/architecture/data.md) |
| Each app | [apps/](docs/apps/) — `accounts`, `core`, `persons`, `condominiums`, `finance`, `billing` (apps with no code yet get their doc when they start) |
| New feature process | [features/README.md](docs/features/README.md) |
| Known gaps | [known-gaps.md](docs/known-gaps.md) |
