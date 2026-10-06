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
| **AccountPayable** (`accounts-payable`) | `description`, `document_number`, `amount`, `issue_date`, `due_date`, `status` `open`/`paid`/`cancelled`, `payment_date`/`amount_paid`/`payment_method` (`boleto`/`pix`/`automatic_debit`/`transfer`, filled only by the `settle` action); read-only `supplier_name`, `condominium_name`, `cost_center_name`, `entry_template_name` | `supplier`, `condominium` + `cost_center` (a condominium expense; both empty = a company expense), `entry_template` (required to pay a condominium expense) |
| **CurrentAccount** (`current-accounts`) | read-only `balance`; `GET /{id}/balances/` answers the total and one row per cost center | one per `condominium` (created by the first payment or the first manual entry) |
| **EntryBatch** (`entry-batches`) | `batch_date`, `origin` `bank`/`cash`/`extra_cash`, `cash_number` (only for the two cash origins) | groups entries; `POST /{id}/entries/` posts several manual entries, all or none |
| **CurrentAccountEntry** (`current-account-entries`) | `registry`, `entry_date`, `competence_month` (first day), `kind` `credit`/`debit`, `amount` (> 0), `description`, `justification`, `origin` `manual`/`automatic_payable`, `is_reversed`, `reversal_of`; read-only names, `batch_origin`, `batch_date` | `current_account`, `batch`, `entry_template`, `cost_center`, `unit` (optional); never edited or deleted, only reversed (`POST /{id}/reverse/`) |
| **Person** (`persons`) | `name`, `email`, `cell_number`, `home_phone`, `business_phone`, `active` | nested `people_individual` (`cpf`, `rg`, `birthday`, `marital_status`, `job`) **or** `people_legal` (`cnpj`, `ie`) |

## Business rules the UI must respect (the server enforces them too)

- Fixed fee requires `fee_amount`; variable fee requires `fee_percentage` and `fee_basis`.
- `due_day` 1–28; discount percentage 0–100; `ideal_fraction` > 0 and ≤ 1 (apportionment per condominium should sum to 1).
- Owner link requires `ownership_percentage` (0–100); tenant link has none; `end_date` ≥ `start_date`.
- A person has only one document kind; it cannot change after creation.
- CPF/CNPJ/CEP travel as digits only; masks are display-only.
- A block must belong to the unit's condominium.
- A condominium expense needs a cost center; paying it needs an entry template of that cost center and posts a debit in the condominium's statement. A company expense has neither and posts nothing. A paid or cancelled account is read-only.
- A manual entry needs a justification; a cash or extra cash batch needs its cash number and a bank batch has none; the competence is the first day of a month. An entry is reversed, never edited.

## Dashboard summary (`dashboard`)

Read-only aggregate: `condominiums`, `units`, `persons` summaries, `responsibles`, `accounts_payable` (open accounts by due window + the oldest), `adjustments_by_month`,
`upcoming_adjustments`, `fixed_revenue`, `leases`, `pending` (units without responsible, inconsistent
apportionment, overdue/next-30-day adjustments, ending leases, condominiums without cost centers, billing-blocked units).
