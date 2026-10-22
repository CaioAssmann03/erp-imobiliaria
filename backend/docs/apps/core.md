---
summary: Company, shared infrastructure (scoping, audit, errors, base models, validators), dashboard, global search, seed_demo.
read-when: you touch Company, scoping, audit, the error contract, the dashboard, search, the seed or shared utilities
skip-if: persons → apps/persons.md; condominium data → apps/condominiums.md; formulas → architecture/data.md
---
# App `core`

Shared infrastructure plus the read-only dashboard and global search (which read the domain apps). Anything two or more apps need belongs here. `accounts` depends on `core`, never the reverse.

## What lives here
| Piece | Where | Note |
|---|---|---|
| `Company`, base models | `models/` | `UUIDModel` (id) and `BaseModel` (id + timestamps), abstract: every model inherits one. `ModelRules` / `@rule` (`models/rules.py`): the base of the `models/rules/` classes |
| Sequential ID | `models/sequential_code.py` | `sequential_code_field(sequence)` and `SequentialCodeMixin` (spec 019): a `BigIntegerField` the database fills from its own sequence on insert; `validate_unique` skips it so `full_clean()` draws no number. Used by `Person` and `Condominium` |
| Company scoping | `scoping.py`, `api/permissions.py` | `scope_to_company` is the one place that decides (a superuser bypasses); the viewset, related-field and admin mixins; `request_company`. Every model declares `company_lookup`; guard tests fail for a model or viewset without it |
| Model rules in serializers | `serializers/model_rules.py` | `ModelRulesMixin`: input is validated by the model's `full_clean()` and returned as a 400; relation fields are company-scoped |
| Error contract | `api/exception_handler.py`, `errors/` (with `errors/registry.py`), `api/schema.py` | every error becomes `{errors: [{field, code, message}]}`; `RuleError` (`errors/base.py`) is the base of every app's `errors/<entity>.py`; the registry collects them for the OpenAPI `ErrorCodeEnum` |
| Audit trail | `audit.py`, `admin.py` | `register_audited`, `AUDIT_EXEMPT`, masked personal values; each app registers in its own `audit.py`; the log admin is superuser-only and read-only |
| Object storage | `storage/object_storage.py`, `errors/object_storage.py` | the only module that imports `boto3`: `get_object_storage()` builds the R2 client from the `AWS_*` settings (any missing one raises the coded 503 `ObjectStorageUnavailable`); signed upload and download URLs, `object_size`, `delete_object`. Tests replace `get_object_storage` with a fake |
| Validators, pagination, search | `validators/`, `api/pagination.py`, `api/filters.py` | `validate_cpf` / `cnpj` / `percentage`; `?page` + `?limit` (default 20, max 100); `?query=` (also `?search=`); a view with `search_code_field = "code"` also matches a term of only digits against the ID and lists that record first (`api/codes.py` decides what is an ID) |
| Seed | `management/commands/seed_demo.py` (arguments and order of the steps) + `seed/` (`demo_data`, `documents`, `fakes`, `validated`, `context`, `persons`, `condominiums`, `finance`) | deterministic and idempotent; validates with `full_clean()` before every save; `--clear` removes only what it created (the finance data too, even after payments and reversals); besides condominiums, units and people it creates 4 suppliers, an entry template per demo cost center and 5 open accounts payable (4 of condominiums, 1 of the company) ready to be paid; some inconsistencies are deliberate (units without owner, wrong apportionment) so the dashboard has data |
| Migrations | `migrations/` | `0001` runs `TrigramExtension()` first (`persons.0001` depends on it); `0002` seeds the single company record the app starts with |

## Endpoints
- `/api/companies/`: staff list, read and edit **only their own company**; create and delete are superuser-only (403).
- `/api/dashboard/` (`DashboardView`): read-only summary of what needs action. It holds **no business rule**: it calls the model and queryset methods shared with the `?pending=` filters. A `DashboardContext` (reference date, adjustments, leases, active units) is built once and small functions read it. The code is the package `views/dashboard/`: `dashboard_views.py` (only `DashboardView`), `scoped_data.py`, `context.py`, and one module per section (`summaries`, `responsibles`, `adjustments`, `fixed_revenue`, `leases`, `pending`, `accounts_payable`); a section never imports the view. The response keys are documented by `serializers/dashboard_serializers.py`; renaming one is a contract change (the client must be regenerated).
- `/api/search/?q=` (`SearchView`): valid with 3+ characters (2+ if numeric); documents match on digits; 5 results per type, "starts with" first. It searches **people** (name, CPF/CNPJ, ID), **condominiums** (name, CNPJ, ID), **units** (number), **blocks** and **cost centers** (name), **accounts payable** (description, document number, supplier), **billing plans** (name) and **billing documents** (payer name, unit number; the latest month first); the last five match text only, so a single digit (an ID lookup) returns nothing for them. One module per type under `views/search/`, all company-scoped; the response always carries every group. A term of only digits (1 to 18) is also an ID lookup: the record with that `code` comes first in the people and condominiums groups (a unit has no ID: it is found by its number), and a single digit searches only the ID, so it returns no unit. `?module=condominiums|rentals` limits the `persons` group to that module (an unknown value is a 400). Every person and condominium item carries its `code`. The code is the package `views/search/`: `search_views.py` (only `SearchView`), `term.py` (classification and minimum lengths), `ranking.py` and one module per register (`persons`, `condominiums`, `units`).

## Definitions the dashboard uses
Next adjustment = `adjustment_base_date + adjustment_period_months`. A link is **current** when `end_date` is empty or ≥ today. Apportionment is inconsistent when the active units' 1st ideal fraction, or a 2nd–6th one in use (a sum above 0), does not sum 1 (more than 0.0001 away: `Unit.is_apportionment_inconsistent`). Leases ending soon: tenant links ending from −30 to +60 days. Accounts payable: only `open` accounts (company expenses included), by due window.

## Layout
`api/` holds the DRF and HTTP plumbing (`exception_handler`, `pagination`, `permissions`, `throttling`, `schema`, `filters`, `middleware`); `errors/` holds the error base, the shared validator errors and `registry.py`. `scoping.py`, `audit.py`, `dates.py`, `checks.py` and `testing.py` stay at the root. Settings refer to `apps.core.api.*` by dotted string.

## Tests
`tests/` is grouped by area: `dashboard/`, `search/`, `scoping/`, `company/`, `errors/` (error codes, contract, model rules), `seed/`, `infrastructure/` (settings, security, health, throttling, audit, dates), `architecture/` (layout guards) and `validators/`. The helpers `base.py` and `scoping_data.py` stay at the top; a test imports them with `from ..base import ...`. A test that locates files from `__file__` counts the extra folder level.
