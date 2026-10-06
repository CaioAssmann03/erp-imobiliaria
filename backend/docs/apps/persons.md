---
summary: Person with an individual (CPF) or legal (CNPJ) record: nested writes, filters, uniqueness per company.
read-when: you touch people, documents or person filters
skip-if: units/owners/tenants → apps/condominiums.md; login users → apps/accounts.md
---
# App `persons`

The business "person": owners, tenants, advisors, any contact. Depends on `core`. A person **belongs to a company**: the same real person in two companies is two records.

## Rules worth knowing
- `PeopleIndividual` (CPF) and `PeopleLegal` (CNPJ) are 1:1 with `Person` and use it as their primary key. A person has one or the other (the UI enforces it; the kind does not change after creation).
- Each document carries a copy of `person.company` (filled and checked by `clean()`), so the database can hold "one CPF, one CNPJ and one RG per company" as constraints; the same document may exist in another company. A duplicate is a 400 reported as a non-field error under `people_individual` / `people_legal`.
- Documents are stored as digits only, never formatted.
- A person referenced by a unit link cannot be deleted (`PROTECT`); as an advisor it is `SET_NULL`. The planned `Person.user` link to `accounts.User` is not implemented.

## API (`/api/persons/`)
Company-scoped; `company` is read-only (taken from the user, children copy it from the person). Filters `?active=` and `?type=individual|legal`; search by name, e-mail, CPF or CNPJ. `PersonSerializer` validates the nested documents with the models' own rules (`validate` builds the candidate from the existing row, so the person's own CPF is not reported as a duplicate) and calls the `create_person` / `update_person` services (`services/`), which write them atomically. Payload names are the API's: `cell_number`, `home_phone`, `business_phone`, `people_individual{cpf, rg, birthday, marital_status, job}`, `people_legal{cnpj, ie}`.

The Admin (`PersonAdmin`) hides `company` on the document inlines and copies it from the person in `save_formset`.
