---
summary: Entities, fields, enums, business rules and the dashboard summary as the UI sees them.
read-when: you touch forms, tables or payloads of a resource
skip-if: how to build the form → norms/forms.md; product scope → requirements/product-scope.md
---
# Domain model (E — Entities)

Names are the backend's (and the generated client's). Ids are UUID strings. API enums are English values;
the UI shows Portuguese labels.

| Entity (API resource) | Key fields | Relations |
|---|---|---|
| **Company** (`companies`) | `legal_name`, `trade_name`, `cnpj` (14 digits), address fields, `active` | has many Condominiums |
| **Condominium** (`condominiums`) | `name`, `cnpj` (required, unique), `type` `residential`/`commercial`, `municipal_registration`, `water_meter`, `electricity_meter`, `active` | `company`, `advisor` (Person, optional), nested `address`, `administration_contract`, `billing_rules` |
| **Address** (nested) | `zip_code` (8 digits), `street`, `number`, `complement`, `district`, `city`, `state` | 1:1 with Condominium; cannot be cleared as a whole through the API |
| **AdministrationContract** (nested) | `fee_type` `fixed`/`variable`, `fee_amount`, `fee_percentage`, `fee_basis` `revenue`/`expense`, `charges_iss_on_fee`, `start_date`, `adjustment_base_date`, `adjustment_period_months`, `adjustment_index` | 1:1 |
| **BillingRules** (nested) | `due_day` (1–28), `due_on_business_day`, `calculation_period` `reference`/`following`, `credit_limit`, `early_payment_discount_percentage` (0–100), `early_payment_discount_days` | 1:1 |
| **Block** (`blocks`) | `name` (unique per condominium) | belongs to Condominium |
| **Unit** (`units`) | `name`, `type` `apartment`/`office`/`store`/`house`/`suite`/`parking_space`/`other`, `resident_count`, `ideal_fraction` (0 < x ≤ 1), `registration_number`, `gas_value`/`water_value`/`electricity_value`, `is_manager_unit`, `is_billing_blocked`, `active` | `condominium`, `block` (optional); read-only `unit_people` |
| **UnitPerson** (`unit-people`) | `role` `owner`/`tenant`, `ownership_percentage`, `start_date`, `end_date` | `unit`, `person`; read-only `person_detail` |
| **Person** (`persons`) | `name`, `email`, `cell_number`, `home_phone`, `business_phone`, `active` | nested `people_individual` (`cpf`, `rg`, `birthday`, `marital_status`, `job`) **or** `people_legal` (`cnpj`, `ie`) |

## Business rules the UI must respect (the server enforces them too)

- Fixed fee requires `fee_amount`; variable fee requires `fee_percentage` and `fee_basis`.
- `due_day` 1–28; discount percentage 0–100; `ideal_fraction` > 0 and ≤ 1 (apportionment per condominium should sum to 1).
- Owner link requires `ownership_percentage` (0–100); tenant link has none; `end_date` ≥ `start_date`.
- A person has only one document kind; it cannot change after creation.
- CPF/CNPJ/CEP travel as digits only; masks are display-only.
- A block must belong to the unit's condominium.

## Dashboard summary (`dashboard`)

Read-only aggregate: `condominiums`, `units`, `persons` summaries, `responsibles`, `accounts_payable` (open accounts by due window + the oldest), `adjustments_by_month`,
`upcoming_adjustments`, `fixed_revenue`, `leases`, `pending` (units without responsible, inconsistent
apportionment, overdue/next-30-day adjustments, ending leases, condominiums without cost centers, billing-blocked units).
