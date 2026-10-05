---
summary: Business formulas and definitions with status (implemented / stored / planned) and what to confirm.
read-when: a feature depends on fees, adjustments, apportionment, billing rules, links or dashboard counters
skip-if: schema and constraints → architecture/data/data-model.md
---
# Domain rules

**Rules live in the models** (validators, `clean()`, constraints, model/queryset methods); the dashboard and API only call them.
Status per rule: **Implemented** (where), **Stored** (data kept, no calculation yet), **Planned**. Where a meaning is inferred, it says *confirm*:
ask the user before building on it.

## Administration fee (`AdministrationContract`)
| Rule | Status |
|---|---|
| `fee_type` `fixed` needs `fee_amount`; `variable` needs `fee_percentage` and `fee_basis` (`revenue`/`expense`); `fee_floor ≤ fee_ceiling` | Implemented (model constraints + serializer) |
| Monthly fixed revenue = sum of `fee_amount` of **active** condominiums with a fixed fee (top 8 shown) | Implemented (`core` dashboard) |
| Variable fee = percentage of the basis (revenue or expense) of the period, limited between floor and ceiling when set | Stored — *confirm* (needs finance entries) |
| `charges_iss_on_fee` (ISS charged on the fee) | Stored |

## Adjustment (reajuste)
| Rule | Status |
|---|---|
| Next adjustment date = `adjustment_base_date` + `adjustment_period_months` (adding months clamps the day to the month's last day) | Implemented (`AdministrationContract.next_adjustment_date()`; dashboard calls it) |
| Overdue when that date is before today (`is_adjustment_overdue`); "next 30 days" when within `[today, today+30]`; chart groups the next 6 months plus overdue | Implemented (dashboard) |
| `adjustment_index` (IGPM, INCC...) is free text; no index values, no recalculated fee, the base date is not advanced after an adjustment | Stored / Planned — *confirm* |

## Apportionment (rateio) and `ideal_fraction`
- `ideal_fraction` is the unit's share of common areas, `0 < x ≤ 1`, 8 decimals. **Implemented** (constraint + serializer).
- The active units of a condominium **cannot sum more than 1** (+ tolerance `0.0001`): `Unit.clean()` rejects the write (error on `ideal_fraction`). **Implemented.**
- Reaching exactly **1** is a *pendency*, not a write rule (units are registered one by one): the dashboard counts condominiums where `|sum − 1| > 0.0001`, via `Unit.objects.inconsistent_apportionment_condominium_ids()`.
- Used later to split expenses among units. **Planned.**

## Billing rules (`BillingRules`)
| Field | Meaning | Status |
|---|---|---|
| `due_day` 1–28 | day of month the charge is due (28 max so every month has it) | Implemented (validation); Stored for billing |
| `due_on_business_day` | move the due date to a business day | Stored — *confirm* direction (next/previous) |
| `calculation_period` `reference`/`following` | charge computed on the reference month or the following one | Stored — *confirm* |
| `early_payment_discount_percentage` (0–100) + `early_payment_discount_days` | discount when paid at least N days before due | Stored — *confirm* |
| `credit_limit` | limit of credit allowed | Stored — *confirm* |

## Units
- `type`, `resident_count`, `registration_number`, utility values (`gas_value`, `water_value`, `electricity_value`: fixed amounts charged to the unit). Stored.
- `is_manager_unit` (síndico's unit) — Stored. `is_billing_blocked` — counted in the dashboard; blocking entries is **Planned**.
- Name unique per block (or per condominium when there is no block); a block must belong to the unit's condominium. **Implemented.**

## People and links (`UnitPerson`)
- Role `owner` needs `ownership_percentage` 0–100; `tenant` has none; `end_date ≥ start_date`; one open link per `(unit, person, role)`. **Implemented.**
- A link is **current** when `end_date` is empty or ≥ today (`UnitPerson.objects.current(reference_date)` / `is_current(reference_date)`). **Responsible** for a unit = at least one current link; units without one are "without responsible"
  (nobody to bill). **Implemented** (dashboard).
- Lease ending: tenant link with `end_date` between today−30 and today+60 days. **Implemented** (dashboard).
- Owners' percentages: at no date may the owner links of a unit sum more than 100 % (`UnitPerson.clean()`, checked at every start date, so ended owners do not block new ones; tenants ignored). **Implemented** (error on `ownership_percentage`). Reaching exactly 100 is not required.
- A person is either individual (CPF) or legal (CNPJ); the kind cannot change after creation (UI rule). Documents are digits-only, validated by check digits.

## Finance (`financeiro`, models only)
- `CostCenter` (replaces "sub-conta"): groups entries per condominium; unique name per condominium. Condominiums with none are flagged in the dashboard.
- `EntryTemplate` (replaces "histórico"): `admin_fee_incidence_percentage` (share of the entry subject to the admin fee), `accumulate_to_balance`,
  `has_accumulation_history`, `is_subject_to_social_security` — meanings inferred from the Sami reference; *confirm* before building entries.

## Dashboard counters (definitions)
`units_without_responsible`, `inconsistent_apportionment`, `overdue_adjustments`, `adjustments_next_30_days`, `leases_ending`, `without_cost_centers`,
`billing_blocked_units` — all computed over **active** condominiums/units. Changing a definition changes the API contract.
