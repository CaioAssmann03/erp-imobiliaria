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
| Company scoping | `scoping.py`, `permissions.py` | `scope_to_company` is the one place that decides (a superuser bypasses); the viewset, related-field and admin mixins; `request_company`. Every model declares `company_lookup`; guard tests fail for a model or viewset without it |
| Model rules in serializers | `serializers/model_rules.py` | `ModelRulesMixin`: input is validated by the model's `full_clean()` and returned as a 400; relation fields are company-scoped |
| Error contract | `exception_handler.py`, `errors/`, `error_registry.py`, `schema.py` | every error becomes `{errors: [{field, code, message}]}`; `RuleError` (`errors/base.py`) is the base of every app's `errors/<entity>.py`; the registry collects them for the OpenAPI `ErrorCodeEnum` |
| Audit trail | `audit.py`, `admin.py` | `register_audited`, `AUDIT_EXEMPT`, masked personal values; each app registers in its own `audit.py`; the log admin is superuser-only and read-only |
| Validators, pagination, search | `validators/`, `pagination.py`, `filters.py` | `validate_cpf` / `cnpj` / `percentage`; `?page` + `?limit` (default 20, max 100); `?query=` (also `?search=`) |
| Seed | `management/commands/seed_demo.py` | deterministic and idempotent; validates with `full_clean()` before every save; `--clear` removes only what it created (the finance data too, even after payments and reversals); besides condominiums, units and people it creates 4 suppliers, an entry template per demo cost center and 5 open accounts payable (4 of condominiums, 1 of the company) ready to be paid; some inconsistencies are deliberate (units without owner, wrong apportionment) so the dashboard has data |
| Migrations | `migrations/` | `0001` runs `TrigramExtension()` first (`persons.0001` depends on it); `0002` seeds the company EVE Administradora |

## Endpoints
- `/api/companies/`: staff list, read and edit **only their own company**; create and delete are superuser-only (403).
- `/api/dashboard/` (`DashboardView`): read-only summary of what needs action. It holds **no business rule**: it calls the model and queryset methods shared with the `?pending=` filters. A `DashboardContext` (reference date, adjustments, leases, active units) is built once and small functions read it. The response keys are documented by `serializers/dashboard_serializers.py`; renaming one is a contract change (the client must be regenerated).
- `/api/search/?q=` (`SearchView`): valid with 3+ characters (2+ if numeric); documents match on digits; 5 results per type, "starts with" first.

## Definitions the dashboard uses
Next adjustment = `adjustment_base_date + adjustment_period_months`. A link is **current** when `end_date` is empty or ≥ today. Apportionment is inconsistent when the active units' `ideal_fraction` differ from 1 by more than 0.0001. Leases ending soon: tenant links ending from −30 to +60 days. Accounts payable: only `open` accounts (company expenses included), by due window.
