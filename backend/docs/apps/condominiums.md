---
summary: Condominium registry: address, administration contract, billing rules, blocks, units, owner/tenant links; rules and endpoints.
read-when: you touch condominiums, units, blocks, contracts, billing rules or unit links
skip-if: person data → apps/persons.md; cost centers → apps/finance.md; business formulas → architecture/data.md
---
# App `condominiums`

The core registry: a condominium with its address, administration contract, billing rules, blocks, units and who owns or rents each unit. Depends on `core` and `persons`. Fields and constraints are in `models/`; `on_delete` and formulas in `architecture/data.md`.

## Rules worth knowing
- **`Condominium`**: `company` is the user's (read-only in the API); the `advisor` (a `Person`) must belong to the same company.
- **`AdministrationContract`** (1:1): the fee rules (fixed needs an amount, variable needs percentage and basis, floor ≤ ceiling) are `AdministrationContractRules`, each also guarded by a check constraint. `fee_floor` / `fee_ceiling` exist in the API but no screen uses them yet.
- **`BillingRules`** (1:1): `due_day` 1–28, discount 0–100.
- **`Unit`**: its `block` must belong to the same condominium (`RESTRICT` on delete). The active units of a condominium cannot sum more than 1 (`UnitRules.apportionment_exceeds_total`); reaching exactly 1 is only a dashboard pendency.
- **`UnitPerson`** (owner/tenant link): `UnitPersonRules` (an owner needs a percentage and a tenant has none; end not before start; the person belongs to the unit's company; owners sum at most 100% at any date). One active link per `(unit, person, role)`.
- Reusable queries live in `models/querysets/` (`UnitPerson.objects.current` / `leases_ending_soon`, `Unit.objects.without_responsible` / `with_lease_ending_soon`, `Condominium.objects.without_cost_centers`, the adjustment queries of the contract). The dashboard and the `?pending=` filters call the same ones, so their numbers match. Block CRUD has an API but no screen.

## API (`/api/`)
`condominiums`, `blocks`, `units`, `unit-people`, all company-scoped (another company's id is 404; as a related id, 400 `does_not_exist`). Filters and search: see the viewsets and the OpenAPI schema. `?pending=` on `condominiums` (`without_cost_centers`, `inconsistent_apportionment`, `overdue_adjustment`, `upcoming_adjustment`) and on `units` (`without_responsible`, `lease_ending`, `billing_blocked`); any other value is a 400.

`CondominiumSerializer` validates the nested `address`, `administration_contract` and `billing_rules` and calls the `create_condominium` / `update_condominium` services (`services/`), which write them atomically: the address is created or updated in place (it cannot be cleared), the contract and rules use `update_or_create`. Every serializer inherits `ModelRulesMixin`, so a violation is a 400 with the model's message and code.
