---
summary: Task → files routing table for the backend docs.
read-when: you start any backend task
skip-if: you already know the file → open it directly
---
# Backend docs

Find your task, open **only** the listed files (usually 2–3). **Read the header first** (first 6 lines of any doc: `summary` / `read-when` / `skip-if`);
if `skip-if` matches or the summary is not what you need, follow its pointer without reading the rest.

| Task | Open |
|---|---|
| **Any new feature** (do this first) | `features/README.md` → copy `features/_template.md` (example: `features/001-person-type-filter.md`) |
| New model / field / constraint | `practices.md` · `architecture/data/data-model.md` · `apps/<app>.md` |
| New endpoint (viewset, serializer, filter) | `architecture/api/api-conventions.md` · `practices.md` · `apps/<app>.md` |
| Nested write (parent + children in one request) | `practices.md` (section "Nested serializers") · `apps/condominiums.md` or `apps/persons.md` |
| New Django app | `architecture/structure/app-anatomy.md` · `architecture/structure/extending.md` |
| Recurring change (field, model, filter, Celery, integration, permissions) | `architecture/structure/extending.md` |
| Business formula or definition | `architecture/data/domain-rules.md` |
| Naming anything (classes, methods, parameters, variables, tests) | `naming.md` |
| Tests | `architecture/quality/testing.md` |
| Security, personal data (LGPD), secrets, roles | `architecture/quality/security.md` |
| Auth, users | `apps/accounts.md` · `architecture/quality/security.md` |
| Dashboard, global search, Company, seed | `apps/core.md` |
| Run, migrate, reset locally | `architecture/operations/local-dev.md` |
| Deploy, production migrations, runbook, backups | `architecture/operations/operations.md` |
| Stack, env vars, request flow | `architecture/foundation/overview.md` |
| Product, modules, vocabulary | `architecture/foundation/product-context.md` |
| Why it is built this way | `architecture/foundation/decisions.md` |
| Something looks wrong or missing | `known-gaps.md` (then **ask the user**) |

## Folder map
| Folder | Holds |
|---|---|
| `architecture/foundation/` | product context, overview, decisions |
| `architecture/structure/` | app anatomy, extension recipes |
| `architecture/api/` | API conventions |
| `architecture/data/` | data model, domain rules |
| `architecture/quality/` | testing, security |
| `architecture/operations/` | deploy/runbook, local development |
| `apps/` | one file per app that has code (stub apps get theirs when they start) |
| `features/` | spec process, template, specs |
| root | `practices.md` (pattern book), `naming.md` (Clean Code naming), `known-gaps.md` |

Always true: English code and docs · UUID pks · business rules only in models · one entity per file · ask when in doubt · spec before feature ·
update the doc you changed in the same change.
