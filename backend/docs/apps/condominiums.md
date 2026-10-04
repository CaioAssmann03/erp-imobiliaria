---
summary: Condominium registry: address, administration contract, billing rules, blocks, units, owner/tenant links; endpoints and rules.
read-when: you touch condominiums, units, blocks, contracts, billing rules or unit links
skip-if: person data → apps/persons.md; cost centers → apps/financeiro.md; business formulas → architecture/data/domain-rules.md
---
# App `condominiums`

**Purpose:** the core registry: condominium + its address, administration contract, billing rules, blocks, units and who owns/rents each unit.
Depends on `core` (Company, validators) and `persons`.

## Models (`models/`, one file per entity; `admnistration_contract.py` keeps a typo in its filename)
| Model | Highlights |
|---|---|
| `Address` | all fields optional (`zip_code` 8 digits, street, number, complement, district, city, state) |
| `Condominium` | `company` PROTECT, `advisor` (Person, SET_NULL), `address` 1:1 SET_NULL, `type` residential/commercial, `name`, `cnpj` (unique, `validate_cnpj`), `municipal_registration`, meters, `active`; ordering `name` |
| `AdministrationContract` | 1:1 (`related_name="administration_contract"`): fee fixed/variable, amount/percentage/basis/floor/ceiling, ISS flag, `start_date`, adjustment base/period/index |
| `BillingRules` | 1:1 (`related_name="billing_rules"`): `due_day` 1–28, business-day flag, calculation period, discount % and days, credit limit |
| `Block` | `name` unique per condominium |
| `Unit` | type enum, `resident_count`, `ideal_fraction` (0,1], utility values, `is_manager_unit`, `is_billing_blocked`, `active`; `block` optional **RESTRICT**; `clean()` checks block belongs to the condominium |
| `UnitPerson` | role owner/tenant, `ownership_percentage`, `start_date`, `end_date`; ordering `-start_date, id`; one active link per `(unit, person, role)` |

Constraints and `on_delete`: see `architecture/data/data-model.md`.

## API (`urls.py` → `/api/`)
| Resource | ViewSet | Search / filters |
|---|---|---|
| `condominiums` | `CondominiumViewSet` | search `name`, `cnpj`, `address__city`; filters `company`, `advisor`, `active`, `type`, `address__state` |
| `blocks` | `BlockViewSet` | filter `condominium` |
| `units` | `UnitViewSet` | search `name`, `registration_number`; filters `condominium`, `block`, `active`, `type`, `is_billing_blocked` |
| `unit-people` | `UnitPersonViewSet` | filters `unit`, `person`, `role` |

## Serializers (`serializers/`, one file per entity)
- `CondominiumSerializer` writes nested `address` (create or update in place; cannot be cleared), `administration_contract` and `billing_rules`
  (`update_or_create` with `defaults`), all in `transaction.atomic`. Nested serializers exclude the parent FK.
- Rules mirrored from constraints in `validate` (contract fee rules, billing ranges, unit fraction and block ownership, unit-person role/percentage/dates)
  so violations return 400.
- `UnitSerializer` exposes read-only `unit_people` (with `person_detail`); `UnitPersonSerializer` exposes read-only `person_detail`.

## Admin / tests
Admin: `Address`, `Condominium` (inlines: blocks, contract, billing), `Unit` (inline: people). Tests: constraints (DB), serializer rules, nested create/update,
API payloads in the frontend's exact shape, list pagination/filters/search, unit-person rules.

## Rules / future
- `fee_floor` / `fee_ceiling` exist in the API but no UI uses them yet. Block CRUD has an API but no UI.
- Apportionment: the active units of a condominium should sum `ideal_fraction` to 1 (reported by the dashboard, not enforced).
