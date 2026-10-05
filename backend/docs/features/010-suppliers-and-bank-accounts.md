---
summary: Spec: Supplier (1:1 with Person, with payment data) and BankAccount (the company's real accounts; a condominium's own account is the exception) with API and Admin, company-scoped, bank data masked in the audit log.
read-when: you touch suppliers, bank accounts, PIX keys, the payee of an expense, or the account boleto money lands in
skip-if: the expenses that use suppliers → roadmap/phase-3-finance-base/03-accounts-payable.md; which account receives a boleto → roadmap/phase-4-billing-generation/README.md; cost centers → features/009-cost-center-entry-template-api.md
---
# 010 — Suppliers and bank accounts

**Status:** done · **Level:** full · **Roadmap:** phase 3 part 02 · **Apps:** finance, core (audit helper reused), frontend (error messages + client) · **Frontend impact:** client regeneration (no new screen)

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | `Supplier` is its own table, 1:1 with `Person`, holding the payment data (bank or PIX key); `Person` is not touched | the user |
| 2026-10-05 | `BankAccount` holds the real bank accounts; the money of a boleto lands in the **company's** account by default, a condominium's own account is the exception | the user (the PDF) |
| 2026-10-05 | No `Condominium.own_bank_account`: it would make `condominiums` depend on `finance` (a circular dependency against the layers `core ← persons ← condominiums ← finance`); the condominium's own account is a `BankAccount` that points at it (`condominium.bank_accounts`). Which account receives a boleto is decided in phase 4 | the user |
| 2026-10-05 | The holder is expressed by `company` (always set: the administrator that owns the account) plus an optional `condominium` (set only for a condominium's own account), instead of "exactly one of two FKs": company scoping needs a single path to the company, and a row with only a condominium would need two | agent; confirmed by the user on 2026-10-05 (it refines the "two optional FKs + exactly one" option; the meaning is the same: holder = `condominium` if set, else `company`) |
| 2026-10-05 | `BankAccount.condominium` must belong to the account's company (model `clean()`); on_delete PROTECT (a condominium with a bank account cannot be deleted, as it will have history) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Account fields: `bank_code` (3 digits, the Brazilian bank code, validated), `bank_name`, `branch`, `account_number`, `kind` (`checking`/`savings`), `nickname`, `pix_key`, `active`; unique per holder on `(bank_code, branch, account_number)` | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Supplier payment data: `bank_code`, `branch`, `account_number`, `account_kind`, `pix_key`, all optional (a supplier paid by boleto has none); if any of bank code, branch and account number is filled, all three are required (model rule) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `pix_key` is free text (a PIX key may be a CPF, CNPJ, e-mail, phone or random key); no format validation here | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Bank data (`branch`, `account_number`, `pix_key`, and `bank_code` of a supplier) is **masked** in the audit log, like personal data | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Deleting is allowed for both in this part (nothing references them yet); accounts payable and the ledger add `PROTECT` when they do | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Flat resources `suppliers` and `bank-accounts`; the supplier response carries a read-only `person_detail`; API and Admin only, no Next screen | agent; confirmed by the user on 2026-10-05 |

## R — Requirements
Accounts payable (part 03) need a payee, and billing (phase 4) needs the account the money lands in.
- [x] R1 — `GET/POST /api/suppliers/` and `GET/PATCH/DELETE /api/suppliers/{id}/`; filters `person`, `active`; search by the person's name and document (CPF/CNPJ); paginated, stable order
- [x] R2 — A person is a supplier at most once (400 on a second `Supplier` for the same person); the person must belong to the user's company (a foreign id is 400 `does_not_exist`)
- [x] R3 — If any of a supplier's `bank_code`, `branch`, `account_number` is filled, all three are required (400 `supplier.bank_data.incomplete`); a supplier with no payment data, or with only a `pix_key`, is valid
- [x] R4 — `GET/POST /api/bank-accounts/` and `GET/PATCH/DELETE /api/bank-accounts/{id}/`; filters `condominium`, `kind`, `active`; search `nickname`, `bank_name`; the `company` is the user's (read-only in the API); paginated, stable order
- [x] R5 — `bank_code` is three digits (400 `bank_code.invalid_format`); the same `(bank_code, branch, account_number)` cannot repeat for the same holder (400 `bank_account.account_number.duplicate_for_holder`), but may exist in another company
- [x] R6 — A bank account's `condominium` must belong to the account's company (400 `bank_account.condominium.other_company`); a condominium of another company is also 400 `does_not_exist` through the API
- [x] R7 — Both resources are company-scoped (spec 004): another company's records are 404, a superuser sees all
- [x] R8 — `ModelAdmin`s for both (company-scoped); both models are audited with `branch`, `account_number`, `pix_key` (and the supplier's `bank_code`) **masked**, and no real value appears in any log entry
- [x] R9 — The new error codes are registered and translated in the frontend; the client is regenerated with the two resources
- [x] R10 — `apps/finance.md`, `architecture/data.md` and the roadmap are updated

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.BankAccount` (the PDF's *ContaBancaria*) | new | UUID; `company` FK PROTECT (`related_name="bank_accounts"`); `condominium` FK PROTECT, null/blank (`related_name="bank_accounts"`); `bank_code` (3 digits, `validate_bank_code`); `bank_name` (blank); `branch`; `account_number`; `kind` (`checking`/`savings`); `nickname` (blank, e.g. "Conta Movimento"); `pix_key` (blank); `active`; timestamps. `company_lookup = "company"`. Ordering `company__legal_name`, `nickname`, `bank_code`. `clean()`: condominium's company equals `company`. `UniqueConstraint(company, bank_code, branch, account_number)` for the company's accounts (`condition: condominium is null`) and `UniqueConstraint(condominium, bank_code, branch, account_number)` (`condition: condominium is not null`) |
| `finance.Supplier` (the PDF's *Fornecedor*) | new | UUID; `person` OneToOne PROTECT (`related_name="supplier"`); `bank_code`, `branch`, `account_number` (blank), `account_kind` (blank, `checking`/`savings`), `pix_key` (blank); `active`; timestamps. `company_lookup = "person__company"`. Ordering `person__name`. `clean()`: bank data complete or empty |
| `finance` validators | new | `validate_bank_code` (exactly three digits) |

New error codes (`apps/finance/error_codes.py`, plus the Portuguese texts):
| Code | Message (English) | Portuguese (frontend) |
|---|---|---|
| `bank_code.invalid_format` | The bank code must have exactly 3 digits. | O código do banco deve ter exatamente 3 dígitos. |
| `bank_account.account_number.duplicate_for_holder` | This holder already has an account with this bank, branch and number. | Este titular já tem uma conta com este banco, agência e número. |
| `bank_account.condominium.other_company` | The condominium belongs to another company. | O condomínio pertence a outra empresa. |
| `supplier.bank_data.incomplete` | Bank code, branch and account number must be filled together. | Informe banco, agência e conta juntos. |

## A — Approach
- **Same pattern as spec 009 and `condominiums`:** serializers with `ModelRulesMixin`, viewsets with `CompanyScopedViewSetMixin`, `DefaultRouter` in `apps/finance/urls.py`, one entity per file. `BankAccountSerializer.create` sets `company` from the user (`request_company`); the rules see it through `ModelRulesMixin`.
- **Why `company` is always set on a bank account.** The scope (`scope_to_company`) follows one path to the company. A condominium's own account still belongs to the administering company, so `company` stays the owner and `condominium` only says "this account is the condominium's". A rule keeps the two consistent.
- **Why no FK from `Condominium` to the account.** It would reverse the layer direction (spec decision above); the reverse accessor `condominium.bank_accounts` answers "does it have its own account?".
- **Supplier is not a `Person` role.** The payment data is finance, not the central registry; the 1:1 table keeps `persons` free of it (decision above).
- **Audit masking** reuses `register_audited(..., masked_fields=...)` of spec 005 (`apps/finance/audit.py`).
- **Rejected:** a `GenericForeignKey` holder (no foreign key in the database); validating the PIX key format here (its kinds differ); a default-account flag (phase 4 decides how boleto money picks the account).

## S — Structure
| File | Change |
|---|---|
| `apps/finance/models/bank_account.py`, `supplier.py`, `models/__init__.py` | new models |
| `apps/finance/validators.py` | `validate_bank_code` |
| `apps/finance/error_codes.py` | the four codes |
| `apps/finance/audit.py` | register both with masked fields |
| `apps/finance/serializers/`, `views/` | `bank_account_*`, `supplier_*` |
| `apps/finance/urls.py` | routes `suppliers`, `bank-accounts` |
| `apps/finance/admin.py` | `BankAccountAdmin`, `SupplierAdmin` (company-scoped) |
| `apps/finance/migrations/0004_bank_accounts_and_suppliers.py` | the two tables and their constraints |
| `apps/finance/tests/test_suppliers.py`, `test_bank_accounts.py`, `test_admin.py` (extend), `test_bank_data_audit.py` | tests |
| `frontend/lib/error-messages.ts`, `frontend/lib/api/generated/` | texts; regenerated client |
| `docs/apps/finance.md`, `architecture/data.md` | docs |
Endpoints:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/suppliers/` | `?person=&active=&query=&page=&limit=` | paginated suppliers with `person_detail` | search by person name or CPF/CNPJ |
| POST | `/api/suppliers/` | `{person, bank_code?, branch?, account_number?, account_kind?, pix_key?, active?}` | 201 | `person` of the user's company |
| GET / PATCH / DELETE | `/api/suppliers/{id}/` | - / partial / - | supplier / 204 | |
| GET | `/api/bank-accounts/` | `?condominium=&kind=&active=&query=&page=&limit=` | paginated accounts | |
| POST | `/api/bank-accounts/` | `{condominium?, bank_code, bank_name?, branch, account_number, kind, nickname?, pix_key?, active?}` | 201 (`company` = the user's) | `company` is read-only |
| GET / PATCH / DELETE | `/api/bank-accounts/{id}/` | - / partial / - | account / 204 | |

## O — Operations
Depends on spec 009 (the finance API pattern) and phase 3a (done).
1. Validator, models, constraints, codes; migration (`makemigrations finance`); model tests.
2. Audit registration with masking; audit tests.
3. Serializers, viewsets, urls; API tests.
4. Admin; admin tests.
5. Frontend: Portuguese texts, regenerate the client; `tsc`, `eslint`, `build`.
6. Docs; roadmap part and spec to `done`.

## N — Norms
`conventions/practices.md` (rules only in models, a code with every rule), `architecture/api.md`, `conventions/naming.md` (codes `model.field.reason`; the shared validator code is `<validator>.<reason>`), `architecture/structure.md`, the layer direction in `architecture/overview.md`.

## S — Safeguards
- **Sensitive data:** bank data and PIX keys are financial and personal data: masked in the audit log (never the real value), not searchable through the API (only the person's name/document and the account's nickname/bank name are), never logged. The API does return them to the user's own company (needed for payments).
- **Company isolation:** `company_lookup` on both models; the scoping guard tests fail otherwise; foreign ids are 400 `does_not_exist`; 404 for foreign records.
- **Integrity:** the unique constraints, the condominium/company consistency and the bank-data completeness are model rules (the Admin and commands obey them); `PROTECT` on `company`, `condominium` and `person`.
- **Backward compatibility:** two new resources and two new tables; no existing field changes; the client is regenerated.
- **Failure modes:** deleting a person that is a supplier, or a condominium that has bank accounts, is refused by `PROTECT` and answers 500 today (known gap #27); the fix there covers both.
- **Performance:** `select_related("person")` on suppliers and `select_related("condominium")` on accounts; filters on indexed foreign keys.

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_suppliers.py::test_crud`, `::test_filters_and_search_by_name_and_document` (also proves the PIX key is not searchable), `::test_list_is_paginated_and_ordered`, `::test_requires_authentication` |
| R2 | `apps/finance/tests/test_suppliers.py::test_a_person_is_a_supplier_only_once`, `::test_foreign_person_is_does_not_exist` |
| R3 | `apps/finance/tests/test_suppliers.py::test_incomplete_bank_data_is_a_400`, `::test_supplier_without_payment_data_is_valid`, `::test_supplier_with_only_a_pix_key_is_valid`, `::test_complete_bank_data_is_valid` |
| R4 | `apps/finance/tests/test_bank_accounts.py::test_crud`, `::test_filters_and_search`, `::test_company_is_the_users_and_read_only`, `::test_list_is_paginated_and_ordered`, `::test_requires_authentication` |
| R5 | `apps/finance/tests/test_bank_accounts.py::test_bank_code_must_have_three_digits`, `::test_duplicate_account_for_the_same_holder_is_a_400`, `::test_the_database_refuses_a_duplicate_account`, `::test_same_account_is_allowed_in_another_company`, `::test_a_condominium_account_does_not_clash_with_the_companys`, `apps/finance/tests/test_suppliers.py::test_bank_code_must_have_three_digits`, `apps/finance/tests/test_validators.py::test_bank_code` |
| R6 | `apps/finance/tests/test_bank_accounts.py::test_condominium_of_another_company_is_rejected`, `::test_condominium_account_of_the_same_company_is_accepted`, `::test_foreign_condominium_is_does_not_exist_in_the_api` |
| R7 | `apps/finance/tests/test_suppliers.py::test_other_company_is_404`, `apps/finance/tests/test_bank_accounts.py::test_other_company_is_404`; the guard tests of `apps/core/tests/test_company_scoping.py` |
| R8 | `apps/finance/tests/test_admin.py::test_new_admins_are_company_scoped`, `apps/finance/tests/test_bank_data_audit.py::test_bank_data_is_masked_in_the_log`, `::test_no_real_bank_value_appears_in_any_entry`, `apps/core/tests/test_audit_trail.py::test_every_model_is_audited_or_exempt` |
| R9 | `apps/core/tests/test_error_codes.py` (registered; the guard also learned to accept a dict comprehension aggregate); the TypeScript compile failed before the four texts existed and passes after; the client has `suppliers` and `bank-accounts` |
| R10 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `mypy apps config` clean; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`manage.py spectacular` → `npx orval --input`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`)
- [x] `docs/apps/finance.md`, `architecture/data.md` updated
- [x] Roadmap part 02 of phase 3 and the index in `features/README.md` updated
