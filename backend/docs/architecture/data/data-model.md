---
summary: Cross-app entity relations, on_delete policy, constraints, indexes, document formats.
read-when: you add models, relations, constraints or indexes
skip-if: business meaning and formulas → architecture/data/domain-rules.md; one app's fields → apps/<app>.md
---
# Data model (cross-app)

```
Company (core)                      Person (persons) ── 1:1 ── PeopleIndividual (cpf, rg, ...)
   │ PROTECT                           │                  └─ 1:1 ── PeopleLegal (cnpj, ie)
Condominium (condominiums) ── advisor ─┘ SET_NULL
   ├─ 1:1 Address (SET_NULL on address delete)
   ├─ 1:1 AdministrationContract (CASCADE)
   ├─ 1:1 BillingRules (CASCADE)
   ├─ 1:N Block (CASCADE) ──────────────┐ RESTRICT
   ├─ 1:N Unit (CASCADE) ───────────────┘ (Unit.block optional)
   │        └─ 1:N UnitPerson (CASCADE) ── PROTECT ── Person
   └─ 1:N CostCenter (financeiro, CASCADE) ── 1:N EntryTemplate (PROTECT)
accounts.User  (independent; no link to Person yet)
```

## Conventions on every model
UUID `id`; `created_at`/`updated_at` (except pure child records that are 1:1 with a parent keyed by it); `@final`; `Meta.verbose_name(_plural)`;
`Meta.ordering` for anything listed; `__str__` with `@override`; related-manager type hints under `if TYPE_CHECKING`.

## `on_delete` policy
| Relation | Rule | Reason |
|---|---|---|
| Condominium → Company | PROTECT | never delete a company with condominiums |
| Condominium → advisor Person | SET_NULL | the advisor is optional |
| Condominium → Address | SET_NULL (1:1) | address is a separate record |
| contract / billing / block / unit / cost center → Condominium | CASCADE | owned parts |
| Unit → Block | RESTRICT | block with units cannot be removed alone, but a condominium delete cascades |
| UnitPerson → Unit | CASCADE | | 
| UnitPerson → Person | PROTECT | keep history; unlink first |
| EntryTemplate → CostCenter | PROTECT | |

## Constraints (each rule also has a validator or `clean()` in the model, so the API answers 400)
- `AdministrationContract`: fixed ⇒ `fee_amount`; variable ⇒ `fee_percentage` and `fee_basis`; `fee_floor ≤ fee_ceiling`.
- `BillingRules`: `due_day` 1–28; discount 0–100.
- `Unit`: `ideal_fraction` in (0, 1]; unique `(condominium, block, name)` and unique `(condominium, name)` when no block; utility values ≥ 0.
- `UnitPerson`: `end_date ≥ start_date`; owner ⇒ percentage 0–100 (**not null**); tenant ⇒ no percentage; one active link per `(unit, person, role)`.
- `Block`: unique `(condominium, name)`. `CostCenter`: unique `(condominium, name)`. `EntryTemplate`: percentage 0–100; unique `(cost_center, name)`.
- SQL note: `CHECK (x >= 0)` passes when `x` is NULL; add `isnull=False` explicitly when null must be rejected.

## Indexes
Trigram GIN indexes on `Person` (`UPPER(name)`, `UPPER(email)`) and `PeopleLegal` (`UPPER(ie)`) via `gin_trgm_ops`; `core.0001` creates the `pg_trgm`
extension and `persons.0001` depends on it. Documents are stored digits-only, so equality/prefix lookups do not need a functional index.

## Documents and formats
CPF 11 digits, CNPJ 14 digits (alphanumeric CNPJ accepted by the validator), CEP 8 digits: stored without punctuation; validators in
`apps/core/validators/`. Money: `DecimalField` (2 places); percentages 0–100 with 2 places; `ideal_fraction` 8 places.
