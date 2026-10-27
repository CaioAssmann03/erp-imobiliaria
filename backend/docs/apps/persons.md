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
- **`code`** is the person's "ID": a number from the sequence `person_code_seq` (`core`'s `sequential_code_field`), unique, assigned by the database on insert, never reused and read-only in the API and the Admin. One person has one `code`, whatever its modules (spec 019).
- **Modules** (specs 046 and 048): a person is released to a module by a `PersonModuleMembership` row (`person`, `module`: unique per pair, deleted with the person), not by a column. The module is a text key: each module's app registers its key in `AppConfig.ready()` with `register_person_module(key)` (`modules.py`), `persons` imports none of those apps, and the model refuses a key that is not registered (`person_module_membership.module.unknown`); a stored key that is no longer registered is simply ignored by the filters. A new module needs only its key, no model and no migration (spec 048). A person may belong to no module, one or both, and keeps one `code`. It organizes lists and searches and gates a `UnitPerson` (needs `condominiums`); it is not access control. The old `modules` array column stays in the database, unused, until a later release drops it.

## API (`/api/persons/`)
Company-scoped; `company` is read-only (taken from the user, children copy it from the person). Filters `?active=`, `?type=individual|legal` and `?person_module=` (a registered module; an unknown one is a 400 `invalid_choice`, a join on the unique membership); search by name, e-mail, CPF, CNPJ or ID (a term of only digits also matches the `code`, and that person comes first). `PersonSerializer` validates the nested documents with the models' own rules (`validate` builds the candidate from the existing row, so the person's own CPF is not reported as a duplicate) and calls the `create_person` / `update_person` services (`services/`), which write them atomically. `POST /api/persons/?person_module=condominiums` releases the new person to that module in the same transaction; `PUT` / `DELETE /api/persons/{id}/modules/{module}/` release and remove one (both idempotent, 204). The payload has no `modules` field. Payload names are the API's: `cell_number`, `home_phone`, `business_phone`, `people_individual{cpf, rg, birthday, marital_status, job}`, `people_legal{cnpj, ie}`.

The Admin (`PersonAdmin`) hides `company` on the document inlines and copies it from the person in `save_formset`.
