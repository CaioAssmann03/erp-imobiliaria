---
summary: Task → files routing table and folder map for the backend docs.
read-when: you start any backend task
skip-if: you already know the file → open it directly
---
# Backend docs

Find your task, open **only** the listed files (usually 2–3). **Read the header first** (first 6 lines of any doc: `summary` / `read-when` / `skip-if`);
if `skip-if` matches or the summary is not what you need, follow its pointer without reading the rest.

| Task | Open |
|---|---|
| **What is done / what comes next** (phases, parts, status, backlog, open cross-phase decisions) | `roadmap/README.md` → the phase folder `README.md` → the part file |
| **Any new feature** (do this first) | the roadmap part (if any) → `features/README.md` → copy `features/_template.md` (full) or `features/_template-lite.md` (small change); example: `features/001-person-type-filter.md` |
| Plan a new phase or part | `roadmap/README.md` → copy `roadmap/_template-phase.md` or `roadmap/_template-part.md` |
| New model / field / constraint | `conventions/practices.md` · `architecture/data.md` · `apps/<app>.md` |
| New endpoint (viewset, serializer, filter) | `architecture/api.md` · `conventions/practices.md` · `apps/<app>.md` |
| Nested write (parent + children in one request) | `conventions/practices.md` (section "Nested serializers") · `apps/condominiums.md` or `apps/persons.md` |
| New Django app, or a recurring change (field, model, filter, Celery, integration, permissions) | `architecture/structure.md` |
| Business formula or definition | `architecture/data.md` |
| Naming anything (classes, methods, parameters, variables, tests) | `conventions/naming.md` |
| Tests | `architecture/quality.md` |
| Security, personal data (LGPD), secrets, roles | `architecture/quality.md` |
| Auth, users | `apps/accounts.md` · `architecture/quality.md` |
| Dashboard, global search, Company, seed | `apps/core.md` |
| Cost centers, entry templates (finance) | `apps/finance.md` |
| Run, migrate, reset locally · deploy, production migrations, runbook, backups | `architecture/operations.md` |
| Stack, env vars, request flow, product vocabulary, why it is built this way | `architecture/overview.md` |
| Something looks wrong or missing | `known-gaps.md` (then **ask the user**) |

## Folder map
| Folder | Holds |
|---|---|
| `roadmap/` | `README.md` (status of all phases, open decisions, PDF → code name map, backlog) · `_template-phase.md` · `_template-part.md` · `phase-N-<slug>/` (a `README.md` + one `NN-<slug>.md` per part, each with its own **Status**) |
| `architecture/` | six files: `overview` (product, stack, decisions) · `data` (model + business rules) · `api` · `structure` (app layout + recipes) · `quality` (tests + security) · `operations` (local, deploy, runbook) |
| `conventions/` | `practices.md` (pattern book) · `naming.md` (Clean Code naming) |
| `apps/` | one file per app that has code (stub apps get theirs when they start) |
| `features/` | spec process, templates (full and lite), index and specs (the contract that implements a roadmap part) |
| `tools/` | `check_docs.py`: validates headers, links, roadmap and spec statuses (runs in CI) |
| root | only this `README.md` and `known-gaps.md` |

## Roadmap vs. feature specs
A roadmap **part** is the plan and status of a slice of a sprint; a **feature spec** is the contract used to implement it. Order of work: part → open questions answered →
spec in `features/` → code → spec `done` → part `Status: done` and the phase table in `roadmap/README.md` updated.

After changing docs run `python backend/docs/tools/check_docs.py`.

Always true: English code and docs · UUID pks · business rules only in models · one entity per file · ask when in doubt · spec before feature ·
update the doc you changed in the same change.
