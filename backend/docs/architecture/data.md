---
summary: Entity relations, on_delete policy, constraints, indexes, formats, and the business formulas with their status.
read-when: you add models, relations or constraints, or a feature depends on fees, adjustments, apportionment, billing rules, links or dashboard counters
skip-if: how to code a model or rule → conventions/practices.md; one app's fields → apps/<app>.md; what is planned → roadmap/README.md
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
accounts.User  (→ Company; no link to Person yet)
Company scoping: every model declares `company_lookup` (path to its company); see `apps/core/scoping.py`
```
**Every model:** UUID `id`; `created_at`/`updated_at` (except pure 1:1 children keyed by the parent); `@final`; `Meta.verbose_name(_plural)`;
`Meta.ordering` when listed; `__str__` with `@override`; reverse-manager type hints under `if TYPE_CHECKING`.

**`on_delete`:** parts owned by a condominium CASCADE; Condominium → Company PROTECT; advisor and address SET_NULL; `Unit.block` RESTRICT (a block with units
cannot go alone, a condominium delete still cascades); `UnitPerson.person` PROTECT (unlink first); `EntryTemplate.cost_center` PROTECT.

## Constraints
Each rule also has a validator or `clean()` in the model, so the API answers 400.
- `AdministrationContract`: `fixed` ⇒ `fee_amount`; `variable` ⇒ `fee_percentage` and `fee_basis` (`revenue`/`expense`); `fee_floor ≤ fee_ceiling`.
- `BillingRules`: `due_day` 1–28 (so every month has it); discount 0–100.
- `Unit`: `ideal_fraction` in (0, 1]; unique `(condominium, block, name)` and `(condominium, name)` without block; utility values ≥ 0; block belongs to the unit's condominium.
- `UnitPerson`: `end_date ≥ start_date`; owner ⇒ `ownership_percentage` 0–100 (not null); tenant ⇒ none; one open link per `(unit, person, role)`.
- `PeopleIndividual`: unique `(company, cpf)` and unique `(company, rg)` when `rg` is set; `PeopleLegal`: unique `(company, cnpj)`; the document's `company` equals `person.company` (`clean()`). The same document may exist in two companies.
- `Condominium`: the advisor and `UnitPerson.person` belong to the same company (`clean()`).
- `BankAccount`: unique `(company, bank_code, branch, account_number)` among the company's accounts and `(condominium, bank_code, branch, account_number)` among a condominium's; the condominium belongs to the account's company; `bank_code` is 3 digits. `Supplier`: one per person; bank code, branch and account number are filled together or not at all.
- `AccountPayable`: `amount > 0`; `amount_paid` null or `> 0`; `due_date >= issue_date`; `condominium` and `cost_center` are both set or both empty; the payment fields are all set exactly when `status = paid`; rules (`clean()`): the cost center belongs to the condominium, condominium and supplier to the company, and only an `open` account can change.
- `Block`: unique `(condominium, name)`. `CostCenter`: unique `(condominium, name)`; its `condominium` is fixed after creation and it cannot be deleted while it has entry templates (model rules). `EntryTemplate`: percentage 0–100; unique `(cost_center, name)`; its `cost_center` is fixed after creation.
- SQL: `CHECK (x >= 0)` passes when `x` is NULL; add `isnull=False` when null must be rejected.

## Indexes and formats
Trigram GIN on `Person` (`UPPER(name)`, `UPPER(email)`) and `PeopleLegal` (`UPPER(ie)`); `core.0001` creates `pg_trgm`, `persons.0001` depends on it.
CPF 11 digits, CNPJ 14 (alphanumeric accepted), CEP 8: stored digits-only, validated in `apps/core/validators/`. Money `DecimalField` (2 places);
percentages 0–100 (2 places); `ideal_fraction` 8 places.

## Business rules and formulas
Rules live in the models; the dashboard and API only call them. **Implemented** (where) · **Stored** (kept, no calculation) · **Planned**. *Confirm* = inferred meaning: ask before building on it.

| Area | Rule | Status |
|---|---|---|
| Fee | Monthly fixed revenue = sum of `fee_amount` of **active** condominiums with a fixed fee (top 8 shown) | Implemented (`core` dashboard) |
| Fee | Variable fee = percentage of the period's revenue/expense, limited by floor and ceiling | Stored — *confirm* (needs finance entries) |
| Fee | `charges_iss_on_fee` | Stored |
| Adjustment | Next date = `adjustment_base_date` + `adjustment_period_months` (day clamped to month end); overdue when before today; "next 30 days" within `[today, today+30]`; chart = next 6 months + overdue | Implemented (`AdministrationContract.next_adjustment_date()`, dashboard) |
| Adjustment | `adjustment_index` is free text; no index values, no recalculated fee, base date not advanced | Stored / Planned — *confirm* |
| Apportionment | Active units of a condominium cannot sum more than 1 (+ tolerance 0.0001): `Unit.clean()` rejects it. Exactly 1 is a *pendency* (dashboard: `|sum − 1| > 0.0001`, `Unit.objects.inconsistent_apportionment_condominium_ids()`) | Implemented |
| Apportionment | Split expenses among units by `ideal_fraction` | Planned |
| Billing rules | `due_on_business_day`, `calculation_period` (`reference`/`following`), early-payment discount (% + days), `credit_limit` | Stored — *confirm* |
| Units | `type`, `resident_count`, `registration_number`, utility values (fixed amounts per unit), `is_manager_unit` | Stored |
| Units | `is_billing_blocked` counted in the dashboard; blocking entries | Planned |
| Links | **Current** link = `end_date` empty or ≥ today (`UnitPerson.objects.current(reference_date)`); **responsible** = at least one current link; none = "without responsible" | Implemented (dashboard) |
| Links | Owner percentages of a unit never sum more than 100 at any start date (`UnitPerson.clean()`; ended owners do not block new ones; tenants ignored); exactly 100 is not required | Implemented |
| Links | Lease ending = tenant link with `end_date` in [today−30, today+60] | Implemented (dashboard) |
| Person | Individual (CPF) or legal (CNPJ), kind fixed after creation (UI rule); documents digits-only with check digits | Implemented |
| Finance | `CostCenter` (was "sub-conta") groups entries per condominium; condominiums with none are flagged. `EntryTemplate` (was "histórico"): `admin_fee_incidence_percentage`, `accumulate_to_balance`, `has_accumulation_history`, `is_subject_to_social_security` | Models only — meanings inferred from Sami, *confirm* |

**Dashboard counters** (over **active** condominiums/units; changing a definition changes the API contract): `units_without_responsible`,
`inconsistent_apportionment`, `overdue_adjustments`, `adjustments_next_30_days`, `leases_ending`, `without_cost_centers`, `billing_blocked_units`.
