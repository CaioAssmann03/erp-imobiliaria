---
summary: Company, shared infra (pagination, search filter, CPF/CNPJ validators), dashboard, global search, seed_demo, initial migrations.
read-when: you touch Company, dashboard, search, seed or shared utilities
skip-if: persons → apps/persons.md; condominium data → apps/condominiums.md; formulas → architecture/data.md
---
# App `core`

**Purpose:** shared infrastructure and cross-module read models. Imports no domain app except for the read-only dashboard and global search (which read `persons` and `condominiums`); `accounts` depends on `core`, never the reverse.

## Owns
| Piece | Where | Notes |
|---|---|---|
| `Company` model | `models/company.py` | `legal_name`, `trade_name`, `cnpj` (14 digits, unique, `validate_cnpj`), address fields, `active`; UUID id; ordering `legal_name` |
| Pagination | `pagination.py` | `StandardPagination`: `?page`, `?limit` (default 20, max 100) |
| Search filter | `filters.py` | `QuerySearchFilter`: `?query=` (also `?search=`), terms split by space |
| Validators | `validators/cpf.py`, `cnpj.py`, `percentage.py` | `validate_cpf`, `validate_cnpj`, `validate_percentage`; used as model field validators, tested in `tests/validators/` |
| Audit trail | `audit.py` | `register_audited(model, masked_fields, excluded_fields)`, `set_audit_actor`, `is_audited`, `AUDIT_EXEMPT`, `mask_personal_value`; the log admin (`AuditLogEntryAdmin`, superuser-only, read-only) is in `admin.py`; each app registers in its own `audit.py` |
| Model bases | `models/base.py` | `UUIDModel` (UUID `id`) and `BaseModel` (`id` + `created_at` + `updated_at`), abstract; every model inherits one of them |
| Error contract | `exception_handler.py` (`api_exception_handler`: every error becomes `{errors: [{field, code, message}]}`), `errors/` (`base.py`: `RuleError`, the enum base that holds a code and its message; `validators.py`: `CoreValidatorError`, the CPF/CNPJ/percentage rules), `error_registry.py` (collects every app's `errors/` enums + the generic codes: `all_error_codes()`), `schema.py` (OpenAPI hook: `ErrorCodeEnum`, `ErrorItem`, `ErrorResponse`) |
| Company scoping | `scoping.py` | `scope_to_company(queryset, user)` (the one place that decides; a superuser bypasses), `CompanyScopedViewSetMixin`, `CompanyScopedPrimaryKeyRelatedField` (foreign-company ids are "does not exist"), `CompanyScopedAdminMixin`, `request_company(...)`. Every model declares `company_lookup`; guard tests fail for a model or viewset without it. `permissions.py`: `IsSuperuser`. `testing.py`: `seeded_company()` for tests |
| Model-rules mixin | `serializers/model_rules.py` | `ModelRulesMixin` (serializers run the model's `full_clean()` → 400; relation fields are company-scoped; on create the rules see the user's company), `build_candidate`, `run_model_rules` |
| Seed command | `management/commands/seed_demo.py` | deterministic demo data validated with `full_clean()` before every save (`_create_validated`); idempotent; `--clear` removes only what it created; demo condominiums are `DemoCondominium` dataclasses; a `SeedContext` carries the random generator, company and persons through small `_create_*` functions |
| Trigram extension | `migrations/0001_initial.py` | `TrigramExtension()` runs first; `persons.0001` depends on it |
| Initial company | `migrations/0002_seed_company.py` | creates EVE Administradora (CNPJ `03136483000144`); reversible |

## Endpoints
| URL | Notes |
|---|---|
| `/api/companies/` | staff: list/read/edit **only their own company**; create and delete are superuser-only (403); search `legal_name`, `trade_name`, `cnpj` |
| `/api/dashboard/` | read-only summary (`DashboardView`) |
| `/api/search/?q=` | global search (`SearchView`) |

### Dashboard (`views/dashboard_views.py`)
Returns `condominiums`/`units`/`persons` summaries (total, active, by type), `responsibles` (active units with a current link), `adjustments_by_month`
(next 6 months + `overdue`), `upcoming_adjustments`, `fixed_revenue` (active condominiums with fixed fee; top 8), `leases` (tenant links ending
from −30 to +60 days), `pending` counters, `accounts_payable` (open accounts, company expenses included: `overdue`, `due_today`, `due_next_7_days`, `due_this_month` as `{count, total}`, plus the 6 oldest in `upcoming`; spec 012). Rules: next adjustment = `adjustment_base_date + adjustment_period_months`; a link is **current** when
`end_date` is null or ≥ today; apportionment is inconsistent when the sum of `ideal_fraction` of active units differs from 1 by more than `0.0001`;
cost centers come from `finance` through `cost_centers`. The dashboard holds **no business rule**: it calls model/queryset methods (`next_adjustment_date`, `UnitPerson.objects.current`, `inconsistent_apportionment_condominium_ids`, `AccountPayable.objects.overdue/due_between`, and the pendency queryset methods shared with the `?pending=` filters, spec 013) and `core.dates.add_months`. Response keys are English and documented by `serializers/dashboard_serializers.py`. Structure: a `DashboardContext` dataclass (reference date, adjustments, leases, active units) is built once and small `_responsibles` / `_lease_entries` / `_pending_counters` functions read it; `DashboardView.get` only composes them.

### Global search (`views/search_views.py`)
`q` valid when ≥ 3 characters (≥ 2 if numeric); documents match on digits (punctuation stripped); results limited to 5 per type, "starts with"
first. Returns `persons` (`document` = CPF or CNPJ), `condominiums` (with city/state from address), `units`.

## Admin / tests
Admin: `CompanyAdmin` (company-scoped). Tests: company API (own company, superuser-only create/delete), isolation matrix and guards (`test_company_scoping.py`), dashboard/search scope, admin scope, search, dashboard rules, seed idempotency and `--clear`, validators.

## Rules
- Anything needed by two or more apps belongs here (validators, pagination, base filters).
- `seed_demo` needs a `Company`; it creates 8 condominiums, 52 units, 26 persons, 62 links, 18 cost centers; some inconsistencies are deliberate
  (units without owner, wrong apportionment, condominiums without cost centers) so the dashboard has data to show.
- Changing a dashboard/search key is a contract change (frontend client regeneration).
