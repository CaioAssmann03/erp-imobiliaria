---
summary: Cost centers, entry templates, suppliers, bank accounts and accounts payable: models, REST API, rules and admin.
read-when: you plan or build finance features, or touch cost centers or entry templates
skip-if: condominium data → apps/condominiums.md; what the fields mean → architecture/data.md; the ledger that will use these → roadmap/phase-3-finance-base/04-current-account-ledger.md
---

# App `finance`

**State:** the registries are done (API + Admin): cost centers and entry templates (spec 009), suppliers and bank accounts (spec 010), accounts payable (spec 011). The ledger, the automatic posting and the rest of phase 3 are not started. Depends on `condominiums` (and `core`).

## Models (`models/`, one file per entity)
Every model declares `company_lookup` (company scoping, spec 004): `CostCenter` → `condominium__company`, `EntryTemplate` → `cost_center__condominium__company`, `BankAccount` → `company`, `Supplier` → `person__company`, `AccountPayable` → `company`; all are audited (spec 005).

| Model | Fields | Rules |
|---|---|---|
| `CostCenter` (the old "sub-conta") | UUID, `condominium` (CASCADE, `related_name="cost_centers"`), `name`, `active`, timestamps | unique `(condominium, name)`; ordering `condominium__name, name`; **`condominium` cannot change** after creation (`clean()`); **cannot be deleted while it has entry templates** (`delete()` raises `cost_center.deletion.has_entry_templates`; deactivate it instead) |
| `EntryTemplate` (the old "histórico") | UUID, `name`, `cost_center` (PROTECT, `related_name="entry_templates"`), `active`, `has_accumulation_history`, `accumulate_to_balance`, `is_subject_to_social_security`, `admin_fee_incidence_percentage` (0–100), timestamps | unique `(cost_center, name)`; ordering `cost_center__condominium__name, cost_center__name, name`; **`cost_center` cannot change** after creation (`clean()`) |
| `BankAccount` (the PDF's *ContaBancaria*) | UUID, `company` (PROTECT, `related_name="bank_accounts"`, always set: the administrator that owns it), `condominium` (PROTECT, optional: set only for a condominium's **own** account, the exception), `bank_code` (3 digits, `validate_bank_code`), `bank_name`, `branch`, `account_number`, `kind` (`checking`/`savings`), `nickname`, `pix_key`, `active`, timestamps | unique `(company, bank_code, branch, account_number)` for the company's accounts and `(condominium, bank_code, branch, account_number)` for a condominium's; `clean()`: the condominium belongs to the same company; ordering `company__legal_name, nickname, bank_code`; branch, account number and PIX key are **masked** in the audit log |
| `Supplier` (the PDF's *Fornecedor*) | UUID, `person` (1:1, PROTECT, `related_name="supplier"`), `bank_code`, `branch`, `account_number`, `account_kind`, `pix_key` (all optional), `active`, timestamps | a person is a supplier once; `clean()`: bank code, branch and account number are filled together or not at all (a PIX key may stand alone); ordering `person__name`; all payment data is **masked** in the audit log |
| `AccountPayable` (the PDF's *ContaPagar*) | UUID, `company` (PROTECT, always set), `condominium` (PROTECT, optional: empty = a company expense), `cost_center` (PROTECT, optional), `supplier` (PROTECT), `description`, `document_number`, `amount` (Decimal 12,2, > 0), `issue_date`, `due_date`, `status` (`open`/`paid`/`cancelled`), `payment_date`, `amount_paid` (> 0, may differ from `amount`), `payment_method` (`boleto`/`pix`/`automatic_debit`/`transfer`), timestamps | `condominium` ⇔ `cost_center` (required with a condominium, not allowed for a company expense, and the cost center belongs to that condominium); condominium and supplier belong to the account's company; `due_date >= issue_date`; the payment fields are filled exactly when `paid`; a closed (paid/cancelled) account never changes; a paid one cannot be deleted; ordering `due_date, -created_at`; the history of amount/due-date changes is the audit log (no masking); `AccountPayable.objects` (`AccountPayableQuerySet`) has `open()`, `overdue(reference_date)` and `due_between(first_day, last_day)` (used by the dashboard, spec 012) |

**Life cycle (model methods, atomic, row-locked):** `settle(payment_date, amount_paid, payment_method)` makes an `open` account `paid`; `cancel()` makes it `cancelled`; both refuse anything but `open` (`account_payable.status.not_open`). Phase 3 part 05 adds the ledger entry inside `settle()`; until then settling only marks the account.

The boleto money lands in the **company's** account by default; a condominium's own account is a `BankAccount` that points at it (`condominium.bank_accounts`). There is **no** `Condominium.own_bank_account` (it would make `condominiums` depend on `finance`); which account receives a boleto is decided in phase 4.

Error codes (`error_codes.py`, `FinanceErrorCode`): `cost_center.name.duplicate_in_condominium`, `cost_center.condominium.immutable`, `cost_center.deletion.has_entry_templates`, `entry_template.admin_fee_incidence_percentage.out_of_range`, `entry_template.name.duplicate_in_cost_center`, `entry_template.cost_center.immutable`, `bank_code.invalid_format`, `bank_account.account_number.duplicate_for_holder`, `bank_account.condominium.other_company`, `supplier.bank_data.incomplete`, `amount.not_positive`, and the `account_payable.*` codes (`amount.not_positive`, `amount_paid.not_positive`, `due_date.before_issue_date`, `cost_center.required_for_condominium`, `cost_center.not_allowed_for_company_expense`, `cost_center.other_condominium`, `condominium.other_company`, `supplier.other_company`, `payment.required_when_paid`, `payment.not_allowed_unless_paid`, `status.not_open`, `deletion.is_paid`).

## API (`urls.py` → `/api/`)
| Resource | ViewSet | Search / filters |
|---|---|---|
| `cost-centers` | `CostCenterViewSet` | search `name`; filters `condominium`, `active` |
| `entry-templates` | `EntryTemplateViewSet` | search `name`; filters `cost_center`, `condominium` (through the cost center, `EntryTemplateFilter`), `active` |
| `suppliers` | `SupplierViewSet` | search the person's `name`, CPF or CNPJ (payment data is not searchable); filters `person`, `active`; the response carries a read-only `person_detail` |
| `bank-accounts` | `BankAccountViewSet` | search `nickname`, `bank_name`; filters `condominium`, `kind`, `active`; `company` is the user's and read-only |
| `accounts-payable` | `AccountPayableViewSet` | search `description`, `document_number`, the supplier's name; filters `status`, `supplier`, `condominium`, `cost_center`, `due_date_after`, `due_date_before`, `is_company_expense` (`AccountPayableFilter`); actions `POST /{id}/settle/` (`{payment_date, amount_paid, payment_method}`) and `POST /{id}/cancel/`; `status` and the payment fields are read-only in the regular serializer; PATCH only while `open` |

Company-scoped (`CompanyScopedViewSetMixin`): another company's records are 404, as a related id 400 `does_not_exist`. `DELETE` of a cost center with templates answers **400** with the code above (the rule is the model's; `api_exception_handler` turns a Django `ValidationError` raised outside a serializer into the usual 400 body). Serializers: `CostCenterSerializer`, `EntryTemplateSerializer` (`ModelRulesMixin`, no rules inside).

## Admin / tests
Admin (company-scoped): `CostCenterAdmin` (lists its entry templates inline), `EntryTemplateAdmin`, `BankAccountAdmin`, `SupplierAdmin`, `AccountPayableAdmin` (status and payment fields read-only: they change through settle/cancel); the Admin blocks a delete that `PROTECT` forbids. Tests: `tests/test_cost_centers.py`, `test_entry_templates.py`, `test_suppliers.py`, `test_bank_accounts.py`, `test_validators.py`, `test_bank_data_audit.py`, `test_accounts_payable.py`, `test_account_payable_rules.py`, `test_admin.py`.

## Used by
`core` dashboard counts active condominiums **without** cost centers ("without_cost_centers"); `seed_demo` creates three cost centers (Fundo de Reserva, Fundo de Obras, Água e Esgoto) for most condominiums.

## Next steps (roadmap phase 3)
The current account (ledger) and the automatic posting rule (extends `AccountPayable.settle()`), payment receipts, the screens. When ledger entries point at an `EntryTemplate` or a `BankAccount`, add the deletion protection to them (as `CostCenter` has).
