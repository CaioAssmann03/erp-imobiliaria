---
summary: Person with individual (CPF) or legal (CNPJ) record, nested writes, filters, uniqueness handling.
read-when: you touch people, documents or person filters
skip-if: units/owners/tenants → apps/condominiums.md; login users → apps/accounts.md
---
# App `persons`

**Purpose:** the business "person": owners, tenants, advisors, any contact. Depends on `core` (validators).

## Models (`models/`)
| Model | Fields | Rules |
|---|---|---|
| `Person` | UUID `id`, `name`, `home_phone`, `business_phone`, `cell_number`, `email`, `active`, timestamps | ordering `name`; trigram GIN on `UPPER(name)`, `UPPER(email)` |
| `PeopleIndividual` | `person` (1:1, primary key, `related_name="people_individual"`), `cpf` (unique, `validate_cpf`), `rg` (unique, optional), `birthday`, `marital_status`, `job` | cascade with Person |
| `PeopleLegal` | `person` (1:1 pk, `related_name="people_legal"`), `cnpj` (unique, `validate_cnpj`), `ie` | trigram GIN on `UPPER(ie)` |

A person has **either** an individual **or** a legal record (the API does not enforce exclusivity at the DB; the UI does; kind cannot change after create).

## API (`/api/persons/`)
- `PersonViewSet` (`select_related("people_individual","people_legal")`), search `name`, `email`, `people_individual__cpf`, `people_legal__cnpj`.
- Filters: `?active=`, `?type=individual|legal` (`PersonFilter` in `filters.py`).
- `PersonSerializer` nests `people_individual` / `people_legal` (write): `create`/`update` in `transaction.atomic`; **uniqueness of cpf/rg/cnpj is checked in
  `validate`, excluding the instance** (the default unique validator would reject a PATCH with the person's own CPF, so nested serializers drop it
  and keep only the format validator). `update` uses `update_or_create(person=..., defaults=...)`.
- Fields in payloads are API names: `cell_number`, `home_phone`, `business_phone`, `people_individual{cpf,rg,birthday,marital_status,job}`,
  `people_legal{cnpj,ie}`. Documents are digits only.

## Admin / tests
Admin: `PersonAdmin` with inlines for both document records, `get_cpf`/`get_cnpj` columns. Tests: models (cascade, uniqueness, validators), create, update
(PATCH same document, other person's document, clearing with nulls), read (nested, search, filters), auth.

## Rules / future
- Never store formatted documents. `Person.user` link to `accounts.User` is planned, not implemented.
- A person referenced by a `UnitPerson` or as an advisor cannot be deleted blindly (`PROTECT` on links, `SET_NULL` on advisor).
