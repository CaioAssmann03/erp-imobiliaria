---
summary: Person with individual (CPF) or legal (CNPJ) record, nested writes, filters, uniqueness handling.
read-when: you touch people, documents or person filters
skip-if: units/owners/tenants → apps/condominiums.md; login users → apps/accounts.md
---
# App `persons`

**Purpose:** the business "person": owners, tenants, advisors, any contact. Depends on `core` (validators, `Company`, company scoping). A person **belongs to a company** (spec 004): the same real person in two companies is two records.

## Models (`models/`)
| Model | Fields | Rules |
|---|---|---|
| `Person` | UUID `id`, `company` (FK, PROTECT, required, `related_name="people"`), `name`, `home_phone`, `business_phone`, `cell_number`, `email`, `active`, timestamps | ordering `name`; trigram GIN on `UPPER(name)`, `UPPER(email)` |
| `PeopleIndividual` | `person` (1:1, primary key, `related_name="people_individual"`), `company` (copy of `person.company`), `cpf` (`validate_cpf`), `rg` (optional), `birthday`, `marital_status`, `job` | cascade with Person; **unique `(company, cpf)`** and unique `(company, rg)` when `rg` is set; `clean()`: `company` is filled from, and must equal, `person.company` |
| `PeopleLegal` | `person` (1:1 pk, `related_name="people_legal"`), `company` (copy), `cnpj` (`validate_cnpj`), `ie` | **unique `(company, cnpj)`**; same `clean()` as the individual; trigram GIN on `UPPER(ie)` |

A person has **either** an individual **or** a legal record (the API does not enforce exclusivity at the DB; the UI does; kind cannot change after create).

## API (`/api/persons/`)
- `PersonViewSet` (`CompanyScopedViewSetMixin`; `select_related("people_individual","people_legal")`), search `name`, `email`, `people_individual__cpf`, `people_legal__cnpj`.
- Filters: `?active=`, `?type=individual|legal` (`PersonFilter` in `filters.py`).
- `PersonSerializer` nests `people_individual` / `people_legal` (write): `create`/`update` in `transaction.atomic`; the document **rules are the models'** (format validators,
  unique constraints): `PersonSerializer.validate` builds the candidate from the existing document row and runs `run_model_rules`, so the person's own CPF is not reported as a duplicate
  (nested serializers drop the default unique validator for that reason). `update` uses `update_or_create(person=..., defaults=...)`.
- `company` is read-only: `create` takes the user's company, a `company` in the body is ignored, the children copy it from the person. A duplicate CPF/CNPJ **in the same company** is a 400 (a non-field error under `people_individual`/`people_legal`: it comes from the model constraint); the same document in another company is accepted.
- Fields in payloads are API names: `cell_number`, `home_phone`, `business_phone`, `people_individual{cpf,rg,birthday,marital_status,job}`,
  `people_legal{cnpj,ie}`. Documents are digits only.

## Admin / tests
Admin: `PersonAdmin` (company-scoped; the inlines hide `company`, `save_formset` copies it from the person) with inlines for both document records, `get_cpf`/`get_cnpj` columns. Tests: models (cascade, uniqueness, validators), create, update
(PATCH same document, other person's document, clearing with nulls), read (nested, search, filters), auth.

## Rules / future
- Never store formatted documents. `Person.user` link to `accounts.User` is planned, not implemented.
- A person referenced by a `UnitPerson` or as an advisor cannot be deleted blindly (`PROTECT` on links, `SET_NULL` on advisor).
