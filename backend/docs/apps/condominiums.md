---
summary: Condominium registry: address, administration contract, billing rules, blocks, units, owner/tenant links; endpoints and rules.
read-when: you touch condominiums, units, blocks, contracts, billing rules or unit links
skip-if: person data → apps/persons.md; cost centers → apps/finance.md; business formulas → architecture/data.md
---
# App `condominiums`

**Purpose:** the core registry: condominium + its address, administration contract, billing rules, blocks, units and who owns/rents each unit.
Depends on `core` (Company, validators) and `persons`.

## Models (`models/`, one file per entity)
| Model | Highlights |
|---|---|
| `Address` | all fields optional (`zip_code` 8 digits, street, number, complement, district, city, state) |
| `Condominium` | `company` PROTECT (read-only in the API; set from the user), `clean()`: the advisor belongs to the same company, `advisor` (Person, SET_NULL), `address` 1:1 SET_NULL, `type` residential/commercial, `name`, `cnpj` (unique, `validate_cnpj`), `municipal_registration`, meters, `active`; ordering `name` |
| `AdministrationContract` | 1:1 (`related_name="administration_contract"`): fee fixed/variable, amount/percentage/basis/floor/ceiling, ISS flag, `start_date`, adjustment base/period/index |
| `BillingRules` | 1:1 (`related_name="billing_rules"`): `due_day` 1–28, business-day flag, calculation period, discount % and days, credit limit |
| `Block` | `name` unique per condominium |
| `Unit` | type enum, `resident_count`, `ideal_fraction` (0,1], utility values, `is_manager_unit`, `is_billing_blocked`, `active`; `block` optional **RESTRICT**; `clean()` checks block belongs to the condominium |
| `UnitPerson` | `clean()` calls `UnitPersonRules` (`models/rules/unit_person.py`: owner needs a percentage, tenant has none, dates, the person belongs to the unit's company, owners sum at most 100%); role owner/tenant, `ownership_percentage`, `start_date`, `end_date`; ordering `-start_date, id`; one active link per `(unit, person, role)` |

Constraints and `on_delete`: see `architecture/data.md`.

## API (`urls.py` → `/api/`)
Every viewset uses `CompanyScopedViewSetMixin` (spec 004): lists, details and writes see only the user's company; another company's id is a 404, as a related id it is a 400 "does not exist". Every model here declares `company_lookup` (`Block`/`Unit`/contract/rules/`Address`: `condominium__company`; `UnitPerson`: `unit__condominium__company`).

| Resource | ViewSet | Search / filters |
|---|---|---|
| `condominiums` | `CondominiumViewSet` | search `name`, `cnpj`, `address__city`; filters `company`, `advisor`, `active`, `type`, `address__state`, `pending` (`without_cost_centers`, `inconsistent_apportionment`, `overdue_adjustment`, `upcoming_adjustment`; spec 013) |
| `blocks` | `BlockViewSet` | filter `condominium` |
| `units` | `UnitViewSet` | search `name`, `registration_number`; filters `condominium`, `block`, `active`, `type`, `is_billing_blocked`, `pending` (`without_responsible`, `lease_ending`, `billing_blocked`; spec 013) |
| `unit-people` | `UnitPersonViewSet` | filters `unit`, `person`, `role` |

## Serializers (`serializers/`, one file per entity)
- `CondominiumSerializer` validates nested `address`, `administration_contract` and `billing_rules` and calls the services `create_condominium` / `update_condominium` (`services/`), which write them in
  `transaction.atomic`: the address is created or updated in place (cannot be cleared), the contract and billing rules use `update_or_create` with `defaults`. Nested serializers exclude the parent FK.
- **Model methods**: `AdministrationContract.next_adjustment_date()`, `is_adjustment_overdue(reference_date)`; `UnitPerson.objects.current(reference_date)`; `Unit.objects.inconsistent_apportionment_condominium_ids()`, `without_responsible(reference_date)`, `with_lease_ending_soon(reference_date)`, `UnitPerson.objects.leases_ending_soon(reference_date)`, `Condominium.objects.without_cost_centers()`, `AdministrationContract.objects.overdue_adjustment_condominium_ids` / `upcoming_adjustment_condominium_ids` (the dashboard and the `?pending=` filters call them).
- **Rules are in the models**: `AdministrationContract.clean()` → `AdministrationContractRules` (fee rules), `UnitPerson.clean()` → `UnitPersonRules` (owner/tenant percentage, dates), `Unit.clean()` → `UnitRules` (block belongs to the condominium, apportionment) (`models/rules/`), field validators
  (`validate_due_day`, `validate_ideal_fraction`, `validate_non_negative`, `validate_percentage`) and constraints. Every serializer inherits `ModelRulesMixin`, so violations return 400 with the model's messages.
- `UnitSerializer` exposes read-only `unit_people` (with `person_detail`); `UnitPersonSerializer` exposes read-only `person_detail`.

## Admin / tests
Admin (company-scoped through `CompanyScopedAdminMixin`): `Address`, `Condominium` (inlines: blocks, contract, billing), `Unit` (inline: people). Tests: constraints (DB), serializer rules, nested create/update,
API payloads in the frontend's exact shape, list pagination/filters/search, unit-person rules, same-company links (`test_company_links.py`).

## Rules / future
- `fee_floor` / `fee_ceiling` exist in the API but no UI uses them yet. Block CRUD has an API but no UI.
- Apportionment: the active units of a condominium cannot sum more than 1 (`UnitRules.apportionment_exceeds_total`); reaching exactly 1 is reported by the dashboard as a pendency.
- Owners: the owner links of a unit cannot sum more than 100 % at any date (`UnitPersonRules.owners_share_exceeds_100_percent`).
