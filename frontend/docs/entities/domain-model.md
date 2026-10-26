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
| **Condominium** (`condominiums`) | read-only `code` (the "ID"), `name`, `cnpj` (required, unique), `type` `residential`/`commercial`, `municipal_registration`, `water_meter`, `electricity_meter`, `active` | `company`, `advisor` (Person, optional), nested `address`, `administration_contract`, `billing_rules` |
| **Address** (nested) | `zip_code` (8 digits), `street`, `number`, `complement`, `district`, `city`, `state` | 1:1 with Condominium; cannot be cleared as a whole through the API |
| **AdministrationContract** (nested) | `fee_type` `fixed`/`variable`, `fee_amount`, `fee_percentage`, `fee_basis` `revenue`/`expense`, `charges_iss_on_fee`, `start_date`, `adjustment_base_date`, `adjustment_period_months`, `adjustment_index` | 1:1 |
| **BillingRules** (nested) | `due_day` (1–28), `due_on_business_day`, `due_month` `reference`/`following`, `competence_month` `same_as_due`/`before_due`, `credit_limit`, `early_payment_discount_percentage` (0–100), `early_payment_discount_days`, `late_fee_percentage` (0–2), `initial_late_fee_percentage` + `initial_late_fee_days` (both or neither), `interest_calculation` `full_month`/`per_day`, `interest_grace_days`, `issuance_day` (1–28, the day of the month the issuance runs), `exempts_manager_unit`, `should_show_qr_code`, `should_show_fee_statement` | 1:1 |
| **LateInterestRate** (`late-interest-rates`) | `start_date`, `monthly_percentage` (0–100); one per start date in a condominium; the rate in force on a date is the latest start not after it, none = no interest | belongs to Condominium; written at once (not with the form's Save), so only after the condominium exists |
| **ApportionmentCriterion** (`apportionment-criteria`) | `name` (unique per condominium), read-only `position` (1 is the main criterion, which cannot be deleted; a criterion a fraction or a plan item uses cannot be deleted either). Managed in a card of the condominium edit page | belongs to Condominium |
| **Block** (`blocks`) | `name` (unique per condominium) | belongs to Condominium |
| **Unit** (`units`) | `name`, `type` `apartment`/`office`/`store`/`house`/`suite`/`parking_space`/`other`, `resident_count`, `fractions` (`[{criterion, value}]`, each 0 < value ≤ 1; sending the list replaces the unit's set, spec 039), `registration_number`, `gas_value`/`water_value`/`electricity_value`, `is_manager_unit`, `billing_recipient` `owner`/`tenant` (who receives the boleto), `is_billing_blocked`, `active` | `condominium`, `block` (optional); read-only `unit_people` |
| **UnitPerson** (`unit-people`) | `role` `owner`/`tenant`, `ownership_percentage`, `start_date`, `end_date` | `unit`, `person`; read-only `person_detail` |
| **AccountPayable** (`accounts-payable`) | `description`, `document_number`, `amount`, `issue_date`, `due_date`, `status` `open`/`paid`/`cancelled`, `payment_date`/`amount_paid`/`payment_method` (`boleto`/`pix`/`automatic_debit`/`transfer`, filled only by the `settle` action); read-only `supplier_name`, `condominium_name`, `cost_center_name`, `entry_template_name` | `supplier`, `condominium` + `cost_center` (a condominium expense; both empty = a company expense), `entry_template` (required to pay a condominium expense) |
| **CurrentAccount** (`current-accounts`) | read-only `balance`; `GET /{id}/balances/` answers the total and one row per cost center | one per `condominium` (created by the first payment or the first manual entry) |
| **EntryBatch** (`entry-batches`) | `batch_date`, `origin` `bank`/`cash`/`extra_cash`, `cash_number` (only for the two cash origins) | groups entries; `POST /{id}/entries/` posts several manual entries, all or none |
| **CurrentAccountEntry** (`current-account-entries`) | `registry`, `entry_date`, `competence_month` (first day), `kind` `credit`/`debit`, `amount` (> 0), `description`, `justification`, `origin` `manual`/`automatic_payable`, `is_reversed`, `reversal_of`; read-only names, `batch_origin`, `batch_date` | `current_account`, `batch`, `entry_template`, `cost_center`, `unit` (optional); never edited or deleted, only reversed (`POST /{id}/reverse/`) |
| **Person** (`persons`) | read-only `code` (the "ID"), `name`, `email`, `cell_number`, `home_phone`, `business_phone`, `active`, `modules` (`condominiums`/`rentals`, default `condominiums`) | nested `people_individual` (`cpf`, `rg`, `birthday`, `marital_status`, `job`) **or** `people_legal` (`cnpj`, `ie`) |
| **BillingPlan** (`billing-plans`) | `name`, `active`, optional `start_month`/`end_month` (first day of a month; the form types them as `MM/AAAA` with a mask (not `<input type="month">`, which is plain text in Firefox and Safari) and sends `YYYY-MM-01`), `items` (at least one, written whole and in order); read-only `condominium_name` | `condominium` (create only: it never changes) |
| **BillingPlanItem** (nested in the plan) | `description`, `calculation_kind` `fixed_amount` (`amount` per unit) / `ideal_fraction_share` (`amount` is the condominium's total, split by `apportionment_criterion`) / `unit_registered_value` (`unit_value_field` `gas`/`water`/`electricity`, no amount); read-only `position`, `cost_center_name`, `entry_template_name` | `cost_center` (active, of the plan's condominium), `entry_template` (active, of that cost center) |
| **BillingDocument** (`billing-documents`, read only + `POST /{id}/cancel/`, `POST /{id}/reissue/` with `due_date`, `GET`/`POST /{id}/pdf/`) | `reference_month`, `competence_month`, `due_date`, `amount`, `status` `issued`/`registered`/`paid`/`cancelled`, derived `is_overdue`, the terms copied at issuance (`discount_*`, `late_fee_percentage`, `initial_late_fee_*`, `interest_*`, `monthly_interest_percentage`), `items`, `registration` (the active boleto: `registered_due_date`, `our_number`, `digitable_line`, `barcode`, `boleto_url`, `pix_payload`, `pix_expires_at`; null when none is active), `delivery` (the e-mail of that boleto: `status` `pending`/`sent`/`delivered`/`failed`, `destination`, `sent_at`, `failure_reason`), `payment` (`paid_on`, `amount`, `net_amount`; null until paid); read-only names | `unit`, `payer` |
| **BillingRun** (`billing-runs`, `POST` issues a condominium's month) | `reference_month`, `status` `running`/`succeeded`/`partial`/`failed`, four counts, `problems` `{unit, unit_name, code}` (code: `no_billing_rules`, `no_plan_in_force`, `inconsistent_apportionment`, `unit_billing_blocked`, `manager_unit_exempt`, `no_current_payer`, `nothing_to_bill`, `document_invalid`, `payer_without_document`, `gateway_account_missing`) | `condominium` |

## Business rules the UI must respect (the server enforces them too)

- Fixed fee requires `fee_amount`; variable fee requires `fee_percentage` and `fee_basis`.
- `due_day` 1–28; discount percentage 0–100; each fraction > 0 and ≤ 1, and for each apportionment criterion the active units of a condominium cannot sum more than 1 (a criterion in use should close at 1: `GET /api/condominiums/{id}/apportionment/` says which does not, and the edit page shows it).
- The late fee is at most 2% (Civil Code limit); the first-days tier needs its percentage and its days together. The competence screen shows an example sentence from a sample reference month (`lib/billing-example.ts`, the same table as the backend's `due_month_of` / `competence_month_of`).
- Owner link requires `ownership_percentage` (0–100); tenant link has none; `end_date` ≥ `start_date`.
- A person has only one document kind; it cannot change after creation.
- `code` is the "ID" users type, on people and condominiums (a unit has none: it is its condominium plus its number): assigned by the server, never edited. Their lists show it as the first column (and as `ID n` in the mobile line), their edit pages show it under the title, and every search accepts it (a number puts that record first).
- A person is released to zero or more modules (a membership row per module; the payload has no `modules`, spec 038). The screens of this app are the Condominiums module's: they pass `person_module=condominiums` (`lib/person-module.ts`) to the persons list, the person picker and the person create (the header search does not filter by module), which releases the new person to the module; a person who is only in `rentals` never shows up and cannot be linked to a unit (400 `unit_person.person.not_in_condominiums`). The Rentals module will pass `rentals`.
- CPF/CNPJ/CEP travel as digits only; masks are display-only.
- A block must belong to the unit's condominium.
- A condominium expense needs a cost center; paying it needs an entry template of that cost center and posts a debit in the condominium's statement. A company expense has neither and posts nothing. A paid or cancelled account is read-only.
- A manual entry needs a justification; a cash or extra cash batch needs its cash number and a bank batch has none; the competence is the first day of a month. An entry is reversed, never edited.

## Dashboard summary (`dashboard`)

Read-only aggregate: `condominiums`, `units`, `persons` summaries, `responsibles`, `accounts_payable` (open accounts by due window + the oldest), `adjustments_by_month`,
`upcoming_adjustments`, `fixed_revenue`, `leases`, `pending` (units without responsible, inconsistent
apportionment, overdue/next-30-day adjustments, ending leases, condominiums without cost centers, billing-blocked units).
