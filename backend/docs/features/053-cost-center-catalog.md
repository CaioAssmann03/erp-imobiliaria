---
summary: Spec 053 — a catalog of sub-contas for the whole administradora (code and name once); each condominium's sub-conta points to one catalog item.
read-when: you change how sub-contas (cost centers) are named, numbered or created, or the catalog screens
skip-if: the ledger and the entries that group by a sub-conta → apps/finance.md; the condominium page where the sub-contas are listed → features/history.md (spec 049); the boleto lines → apps/billing.md
---
# 053 — Cost center catalog (sub-contas of the administradora)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** finance, frontend · **Frontend impact:** client regeneration, new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-29 | One **catalog** for the whole administradora (company): a sub-conta has a **code** and a **name** once, and each condominium **uses** the ones it wants. The 0001 is the same Fundo de Reserva in every condominium. Balances stay per condominium | the user |
| 2026-10-29 | A condominium's sub-conta keeps its own row (the ledger, templates and boleto lines keep pointing to it): it gains a required `catalog_item`, and its `code` and `name` become **copies kept equal** to the item's, so no other screen, filter or report changes | agent, to be confirmed |
| 2026-10-29 | The existing sub-contas are grouped **by name** (ignoring case and spaces) into catalog items per company; the item takes the code most used for that name (a code already taken by another name goes to the next free one), and each sub-conta takes the item's code and name. Re-numbering existing codes is accepted because the system has no real data yet | agent, to be confirmed |
| 2026-10-29 | Creating a sub-conta **through the API** needs a catalog item (`name` and `code` are read only there). Creating one in code by name (seeds, tests) finds or creates the catalog item of that name, so nothing else breaks | agent, to be confirmed |
| 2026-10-29 | Renaming or renumbering a catalog item updates every sub-conta that uses it; an item used by a sub-conta cannot be deleted (deactivate it); a deactivated item cannot be picked for a new sub-conta; one condominium cannot use an item twice | agent, to be confirmed |

## R — Requirements
- [x] R1 — `CostCenterCatalogItem`: `company`, `code` (unique per company; the next free one when left out, 0 for the first), `name` (unique per company, case-insensitive), `active`; audited; company-scoped API `cost-center-catalog` (CRUD, `?active=`, `?query=` on the name)
- [x] R2 — `CostCenter.catalog_item` is required, belongs to the condominium's company, is unique per condominium, and `code`/`name` always equal the item's after a save
- [x] R3 — A catalog item's change (name or code) reaches every sub-conta that uses it; deleting a used item is refused (`cost_center_catalog_item.deletion.in_use`); an inactive item cannot be picked for a new sub-conta
- [x] R4 — `POST /api/cost-centers/` takes `condominium` and `catalog_item` (and `active`); `name` and `code` in the payload are ignored/read only; another company's item is a 400 `does_not_exist`
- [x] R5 — Creating a `CostCenter` in code with only a `name` finds or creates the company's catalog item of that name (seeds and tests keep working)
- [x] R6 — The migration groups the existing sub-contas by name into items per company, copes with a code already taken, and every sub-conta ends with an item; it reverses (the columns stay)
- [x] R7 — Screens: **Financeiro → Catálogo de sub-contas** (list, new, edit; delete with the in-use refusal explained), and the condominium page's **Nova sub-conta** picks an item from the catalog (the name and code are shown, not typed); editing a sub-conta only changes **ativa**

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.CostCenterCatalogItem` | new | `company` (PROTECT), `code` PositiveSmallInteger, `name` (≤ 120), `active`; unique `(company, code)` and `(company, Lower(name))`; `company_lookup = "company"` |
| `finance.CostCenter` | `catalog_item` FK (PROTECT, `related_name="cost_centers"`), unique `(condominium, catalog_item)`; `code` and `name` stay as copies | rules: item of the same company; active item on create |

## A — Approach
- **Copies, not a join.** `CostCenter.code`/`name` stay columns kept in sync by the model (`save` copies them; the catalog item's `save` updates its sub-contas), so the many places that read `cost_center.name` (boleto PDF, ledger, search, filters, ordering) need no change. The catalog is the one place to rename.
- **Rules in the models:** `CostCenterCatalogItem` (code assignment, delete refusal, propagation) and `CostCenter.clean` (company of the item, active item on create); no rule in serializers or views.
- **Soft link for code paths:** `save` links a sub-conta created with only a name to the company's item of that name (creating it when missing), so seeds and the ~45 tests keep working; the API is strict.
- **Migrations:** three, because Postgres refuses to mix a data update with the `NOT NULL` change in one transaction: schema (item + nullable FK), data (grouping), constraint (non-null + unique).
- Rejected: a join through the item on every read (a large rewrite for no gain); one catalog per condominium (that is today's state).

## S — Structure
| Path | Change |
|---|---|
| `finance/models/cost_center_catalog_item.py`, `finance/errors/cost_center_catalog_item.py`, `models/rules` if needed | new |
| `finance/models/cost_center.py`, `finance/errors/cost_center.py` | `catalog_item`, sync, rules |
| `finance/migrations/0017…0019` | schema, data, constraint |
| `finance/serializers/cost_center_catalog_item_serializers.py`, `views/cost_center_catalog_item_views.py`, `urls.py`, `admin.py`, `audit.py` | catalog API and admin |
| `finance/serializers/cost_center_serializers.py` | `catalog_item` in, `name`/`code` read only |
| `seed/*` | unchanged by design (R5) |
| Frontend: `lib/schemas/cost-center.ts`, `condominiums/_components/CostCenterForm.tsx`, `app/(dashboard)/finance/cost-center-catalog/**`, `lib/module-menu.ts`, `lib/error-messages.ts`, docs |

| Method | URL | Notes |
|---|---|---|
| CRUD | `/api/cost-center-catalog/` | `?active=`, `?query=`; delete of a used item → 400 |
| POST/PATCH | `/api/cost-centers/` | `catalog_item` required on create; `name`/`code` read only |

## O — Operations
1. Models, errors, migrations (with a migration test), serializers, views, admin, audit; tests; fix the tests whose expectations assumed per-condominium numbering.
2. Regenerate the client; screens; menu; messages.
3. Docs (`apps/finance.md`, `known-gaps.md` row for the catalog, frontend docs); gate.

## N — Norms
Business rules only in models; migrations never edit applied ones; errors coded in `errors/`; tokens only in the frontend; Portuguese UI.

## S — Safeguards
- **Data:** the data migration only reads and rewrites `code`/`name`/`catalog_item` of sub-contas, never deletes; `PROTECT` on both foreign keys; the ledger still points at the unchanged sub-conta rows.
- **Compatibility:** the sub-conta payload keeps `id`, `condominium`, `code`, `name`, `active` and gains `catalog_item`; the old create (`name`) is refused by the API.
- **Concurrency:** the next code is taken inside `transaction.atomic` with the company's items locked (two creations cannot take the same code; the unique constraint is the last guard).
- **Audit:** the catalog is audited; a sub-conta's copied name changes are logged through the item.

## Test plan
| Criterion | Test |
|---|---|
| R1, R3 | `finance/tests/test_cost_center_catalog.py` |
| R2, R5 | `finance/tests/test_cost_centers.py` (updated) |
| R4 | `finance/tests/test_cost_center_catalog.py` (API) |
| R6 | `finance/tests/test_cost_center_catalog_migration.py` |
| R7 | `frontend/tests/module-menu.test.mjs`, `frontend/tests/app-shell.test.mjs` (links); the screens by hand: a gap written down |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan, or a written gap
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`pnpm generate:api`), or `N/A — no API change`
- [ ] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any)
- [ ] Roadmap part and phase table updated — N/A (Roadmap: none); index in `features/README.md` updated
