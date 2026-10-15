---
summary: Entity relations, on_delete policy, formats, and the business formulas with their status.
read-when: you add models or relations, or a feature depends on fees, adjustments, apportionment, billing rules, links or dashboard counters
skip-if: how to code a model or rule → conventions/practices.md; one app's rules → apps/<app>.md; what is planned → roadmap/README.md
---
# Data and domain rules

## Relations
```
Company (core) ◄── PROTECT ── Person (persons) ── 1:1 ── PeopleIndividual (company, cpf, rg, ...)
   │ ▲ PROTECT                          │                  └─ 1:1 ── PeopleLegal (company, cnpj, ie)
   │ └─ accounts.User.company (every user belongs to one company)
Condominium (condominiums) ── advisor ─┘ SET_NULL
   ├─ 1:1 Address (SET_NULL)    ├─ 1:1 AdministrationContract (CASCADE)    ├─ 1:1 BillingRules (CASCADE)
   ├─ 1:N Block (CASCADE) ── RESTRICT ── Unit.block (optional)
   ├─ 1:N Unit (CASCADE) └─ 1:N UnitPerson (CASCADE) ── PROTECT ── Person
   └─ 1:N CostCenter (finance, CASCADE) ── 1:N EntryTemplate (PROTECT)
Company ◄── PROTECT ── BankAccount (finance) ── PROTECT ──► Condominium (optional: a condominium's own account)
Person ◄── 1:1 PROTECT ── Supplier (finance: payment data)
Company ◄── PROTECT ── AccountPayable (finance) ── PROTECT ──► Supplier, CostCenter, Condominium (optional: empty = a company expense)
Company ◄── PROTECT ── CurrentAccount (finance; the holder is a generic relation)
```
**Every model** has a UUID `id` and (except `Block`, `BillingRules`, `AdministrationContract`, and the documents keyed by their `person`) `created_at` / `updated_at`, from the abstract bases in `core/models/base.py`; `@final`; `Meta.verbose_name(_plural)`; `Meta.ordering` when listed; every model declares `company_lookup`.

**`on_delete`:** parts owned by a condominium CASCADE; `Condominium` → `Company` PROTECT; advisor and address SET_NULL; `Unit.block` RESTRICT (a block with units cannot go alone, a condominium delete still cascades); `UnitPerson.person` PROTECT (unlink first); `EntryTemplate.cost_center` PROTECT.

**Constraints and rules** are in each model's `Meta.constraints`, `clean()` and `models/rules/`, with the same message and code (`errors/`). Two to remember: SQL `CHECK (x >= 0)` passes when `x` is NULL (add `isnull=False` when null must fail), and the same CPF, CNPJ or RG may exist in two companies (unique per company, not global).

## Indexes and formats
Trigram GIN on `Person` (`UPPER(name)`, `UPPER(email)`) and `PeopleLegal` (`UPPER(ie)`); `core.0001` creates `pg_trgm`, `persons.0001` depends on it. CPF 11 digits, CNPJ 14 (alphanumeric accepted), CEP 8: stored digits-only, validated in `core/validators/`. Money is a `DecimalField` (2 places); percentages 0–100 (2 places); `ideal_fraction` 8 places. `code` (the "ID" users type) is a whole number from one PostgreSQL sequence per kind of record: `person_code_seq`, `condominium_code_seq`, `unit_code_seq` (and `registry` for ledger entries); it is unique, never reused, read-only and assigned by the database.

## Business rules and formulas
Rules live in the models; the dashboard and API only call them. **Implemented** · **Stored** (kept, no calculation) · **Planned**. *Confirm* = inferred meaning: ask before building on it.

| Area | Rule | Status |
|---|---|---|
| Fee | Monthly fixed revenue = sum of `fee_amount` of **active** condominiums with a fixed fee (top 8 shown) | Implemented (dashboard) |
| Fee | Variable fee = percentage of the period's revenue/expense, limited by floor and ceiling; `charges_iss_on_fee` | Stored — *confirm* (needs finance entries) |
| Adjustment | Next date = `adjustment_base_date` + `adjustment_period_months` (day clamped to month end); overdue when before today; "next 30 days" within `[today, today+30]`; chart = next 6 months + overdue | Implemented (`AdministrationContract.next_adjustment_date()`, dashboard) |
| Adjustment | `adjustment_index` is free text; no index values, no recalculated fee, base date not advanced | Stored / Planned — *confirm* |
| Apportionment | Active units of a condominium cannot sum more than 1 (+ tolerance 0.0001). Exactly 1 is a *pendency* (dashboard: `|sum − 1| > 0.0001`) | Implemented (`UnitRules`) |
| Apportionment | Split expenses among units by `ideal_fraction` | Planned |
| Billing rules | `due_on_business_day`, `calculation_period` (`reference`/`following`), early-payment discount (% + days), `credit_limit` | Stored — *confirm* |
| Units | `type`, `resident_count`, `registration_number`, utility values, `is_manager_unit`; `is_billing_blocked` is counted in the dashboard, blocking entries is planned | Stored |
| Links | **Current** link = `end_date` empty or ≥ today (`UnitPerson.objects.current`; it ignores `start_date`); **responsible** = at least one current link; none = "without responsible" | Implemented (dashboard) |
| Links | Owner percentages of a unit never sum more than 100 at any start date (ended owners do not block new ones; tenants ignored; exactly 100 is not required) | Implemented (`UnitPersonRules`) |
| Links | Lease ending = tenant link with `end_date` in [today−30, today+60] | Implemented (dashboard) |
| Person | Individual (CPF) or legal (CNPJ), kind fixed after creation (UI rule); documents digits-only with check digits | Implemented |
| IDs | `Condominium`, `Person` and `Unit` have a `code` (their "ID"); owners and tenants are identified by the person's `code`; a numeric search finds the exact `code` first | Implemented (spec 019) |
| Modules | A person belongs to one or more modules (`condominiums`, `rentals`); lists, pickers and search show only the module's people, and a unit link needs `condominiums`; the same person keeps one `code` in every module | Implemented (spec 019); the rentals models follow in phase 8 |
| Finance | `CostCenter` (was "sub-conta") groups entries per condominium; condominiums with none are flagged. `EntryTemplate` (was "histórico"): `admin_fee_incidence_percentage`, `accumulate_to_balance`, `has_accumulation_history`, `is_subject_to_social_security` | Models only — meanings inferred from Sami, *confirm* |

**Dashboard counters** (over **active** condominiums and units; changing a definition changes the API contract): `units_without_responsible`, `inconsistent_apportionment`, `overdue_adjustments`, `adjustments_next_30_days`, `leases_ending`, `without_cost_centers`, `billing_blocked_units`.
