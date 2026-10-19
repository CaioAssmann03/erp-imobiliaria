---
summary: Task → files routing table and folder map for the backend docs.
read-when: you start any backend task
skip-if: you already know the file → open it directly
---
# Backend docs

Find your task, open **only** the listed files (usually 2–3). **Read the header first** (the first 6 lines of any doc: `summary` / `read-when` / `skip-if`); if `skip-if` matches or the summary is not what you need, follow its pointer without reading the rest.

| Task | Open |
|---|---|
| **What is done / what comes next** | `roadmap/README.md` → the phase folder `README.md` → the part file |
| **Any new feature** (do this first) | the roadmap part (if any) → `features/README.md` → copy `features/_template.md` (full) or `features/_template-lite.md` (small change); examples: `features/history.md` (finished specs) |
| Plan a new phase or part | `roadmap/README.md` → copy `roadmap/_template-phase.md` or `roadmap/_template-part.md` |
| New model, field, constraint, rule | `conventions/practices.md` · `architecture/data.md` · `apps/<app>.md` |
| New use case (several models, a transaction, a state change) | `conventions/practices.md` §3b · `apps/<app>.md` |
| New endpoint (viewset, serializer, filter) · nested write | `architecture/api.md` · `conventions/practices.md` · `apps/<app>.md` |
| New Django app, or a recurring change | `architecture/structure.md` |
| Business formula or definition | `architecture/data.md` |
| Naming anything | `conventions/naming.md` |
| Tests · security, personal data (LGPD), secrets | `architecture/quality.md` |
| One app: `accounts`, `core` (dashboard, search, seed, scoping, audit, errors), `persons`, `condominiums`, `finance`, `billing` | `apps/<app>.md` |
| Run, migrate, reset locally · deploy, production migrations, runbook, backups | `architecture/operations.md` |
| Stack, env vars, request flow, vocabulary, why it is built this way | `architecture/overview.md` |
| Why something was built a certain way, or what `spec NNN, Rn` in a test means | `features/history.md` |
| Something looks wrong or missing | `known-gaps.md` (then **ask the user**) |

## Folder map
| Folder | Holds |
|---|---|
| `roadmap/` | `README.md` (status of all phases, open decisions, PDF → code name map, backlog), templates, and `phase-N-<slug>/` (a `README.md` + one `NN-<slug>.md` per part, each with its own **Status**) |
| `architecture/` | `overview` · `data` · `api` · `structure` · `quality` · `operations` |
| `conventions/` | `practices.md` (pattern book) · `naming.md` |
| `apps/` | one file per app that has code |
| `features/` | the spec process and templates, the specs still open, and `history.md` (the finished ones, condensed) |
| `tools/` | `check_docs.py`: validates headers, links, roadmap and spec statuses (runs in CI) |

A roadmap **part** is the plan and status of a slice of a sprint; a **feature spec** is the contract used to implement it. Order of work: part → open questions answered → spec → code → spec `done` (condensed into `features/history.md`) → part `Status: done` and the phase table updated. After changing docs run `python backend/docs/tools/check_docs.py`.

Always true: English code and docs · UUID pks · business rules only in models · one entity per file · ask when in doubt · spec before feature · update the doc you changed in the same change.
