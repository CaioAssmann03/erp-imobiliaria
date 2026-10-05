---
summary: Spec: AccountPayable (conta a pagar) with supplier, cost center, due date, money amounts and the open → paid / cancelled life cycle (settle and cancel actions); company-scoped, audited; no receipt file and no screen yet.
read-when: you touch accounts payable, settling ("baixa") an expense, the payee of an expense, or add something that must hook into settling
skip-if: the ledger entry created when an account is settled → roadmap/phase-3-finance-base/05-automatic-ledger-posting.md; suppliers and bank accounts → features/010-suppliers-and-bank-accounts.md; payment receipts and screens → roadmap/phase-3-finance-base/06-payment-receipts.md
---
# 011 — Accounts payable

**Status:** done · **Level:** full · **Roadmap:** phase 3 part 03 · **Apps:** finance, frontend (error messages + client) · **Frontend impact:** client regeneration (no screen)

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-05 | The expense is a condominium's or the company's own: `condominium` is optional and empty means a company expense; the rental contract (phase 8) is added later as another optional FK with an "at most one" `CheckConstraint`; no polymorphic table | the user |
| 2026-10-05 | The payment receipt file is **not** in this part: a separate part after the hosting is chosen (bucket + signed URL) | the user |
| 2026-10-05 | Life cycle in this part: `open → paid` (settle) and `open → cancelled`; undoing a settlement (reversal) belongs to part 05 with the automatic ledger entry; for now settling only marks the account | the user |
| 2026-10-05 | Backend only: API, Admin and the regenerated client; the screens come after the ledger (a new part) | the user |
| 2026-10-05 | `company` is always set (the administrator that owns the expense) and `condominium` is optional, the same one-path-to-the-company refinement as `BankAccount` (spec 010); the expense of a condominium is stored with both | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The cost center (the PDF's *SubConta* that classifies the expense) is required when there is a condominium and not allowed for a company expense (cost centers belong to a condominium); it must belong to that condominium | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `supplier` is required and must belong to the account's company | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Settling and cancelling are model methods (`settle(payment_date, amount_paid, payment_method)`, `cancel()`), called by the actions `POST …/settle/` and `POST …/cancel/`; part 05 extends `settle()` with the ledger entry in the same transaction | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Only an **open** account can be edited, settled or cancelled; a paid or cancelled one is closed (model rule `clean()`, so the API, the Admin and code obey it) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | A paid account cannot be deleted (cancel instead of delete for an open one is allowed either way); deleting is otherwise allowed until the ledger references it | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `amount_paid` may differ from `amount` (interest, discount) and must be positive; the payment fields are filled exactly when the status is `paid` | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | Payment methods: `boleto`, `pix`, `automatic_debit`, `transfer` (the PDF's list) | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | `due_date` cannot be before `issue_date` when the issue date is given | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The history of changes of amount and due date is the audit trail (spec 005, registered without masking), not extra columns; this refines spec 005's note that finance records audit themselves: that holds for the immutable ledger entries (part 04), not for editable records | agent; confirmed by the user on 2026-10-05 |
| 2026-10-05 | The database constraint that pairs `condominium` with `cost_center` reuses the code `account_payable.cost_center.required_for_condominium` (it is the DB guard; the API answers with the more specific `clean()` codes first) | agent, found while implementing; **not yet confirmed by the user** |
| 2026-10-05 | `settle()` and `cancel()` lock the stored row with `select_for_update()` and refresh the instance inside the transaction; the Admin shows status and the payment fields read-only | agent, found while implementing; **not yet confirmed by the user** |

## R — Requirements
Every expense a condominium (or the company) must pay is registered with its payee, amount and due date, and later settled ("baixa") with the real payment date and amount. This is the source of the automatic ledger entry of part 05.
- [x] R1 — `GET/POST /api/accounts-payable/`, `GET/PATCH/DELETE /api/accounts-payable/{id}/`; filters `status`, `supplier`, `condominium`, `cost_center`, `due_date_after`, `due_date_before`, `is_company_expense`; search description, document number and the supplier's name; paginated, ordered by due date
- [x] R2 — A new account is always `open`; `company` is the user's (read-only); `status`, `payment_date`, `amount_paid` and `payment_method` are read-only in the regular serializer (they change only through the actions)
- [x] R3 — `amount` is greater than zero; `due_date` is not before `issue_date` (when given)
- [x] R4 — With a `condominium`, a `cost_center` of that condominium is required; for a company expense (no condominium) a cost center is not allowed; the condominium and the supplier must belong to the user's company
- [x] R5 — `POST /api/accounts-payable/{id}/settle/` with `{payment_date, amount_paid, payment_method}` makes an open account `paid` with those values, atomically; `amount_paid` is greater than zero and may differ from `amount`
- [x] R6 — `POST /api/accounts-payable/{id}/cancel/` makes an open account `cancelled`
- [x] R7 — A paid or cancelled account cannot be edited, settled again, cancelled or settled-after-cancel (400 `account_payable.status.not_open`); a paid account cannot be deleted (400 `account_payable.deletion.is_paid`)
- [x] R8 — The payment fields are filled exactly when the status is `paid` (model rule and database constraint)
- [x] R9 — Company scoping: another company's accounts are 404; foreign ids are 400 `does_not_exist`; a superuser sees all
- [x] R10 — `ModelAdmin` (company-scoped); the model is audited, so every change of amount or due date is logged with who and when
- [x] R11 — The new codes are registered and translated in the frontend; the client is regenerated
- [x] R12 — `apps/finance.md`, `architecture/data.md`, `architecture/api.md` and the roadmap (incl. the two new parts) are updated

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `finance.AccountPayable` (the PDF's *ContaPagar*) | new | UUID; `company` FK PROTECT (`related_name="accounts_payable"`); `condominium` FK PROTECT, null/blank (`related_name="accounts_payable"`); `cost_center` FK PROTECT, null/blank (`related_name="accounts_payable"`); `supplier` FK PROTECT (`related_name="accounts_payable"`); `description` (255); `document_number` (60, blank: invoice number or the supplier's barcode); `amount` Decimal(12,2); `issue_date` (null/blank); `due_date`; `status` (`open`/`paid`/`cancelled`, default `open`); `payment_date` (null); `amount_paid` Decimal(12,2) (null); `payment_method` (blank, `boleto`/`pix`/`automatic_debit`/`transfer`); timestamps. `company_lookup = "company"`. Ordering `due_date`, `-created_at` |
| methods | new | `settle(payment_date, amount_paid, payment_method)` and `cancel()`: run `full_clean()` and `save()` in `transaction.atomic()`; refuse unless the stored status is `open` |
| `finance` validators | new | `validate_positive_amount` (greater than zero) |

Constraints (the database guard of each rule; every one has a code):
1. `amount > 0`.
2. `amount_paid` is null or `> 0`.
3. `issue_date` null or `due_date >= issue_date`.
4. `(condominium is null) = (cost_center is null)`.
5. `status = paid` ⇔ `payment_date`, `amount_paid` and `payment_method` all set; otherwise all empty.

New error codes (`apps/finance/error_codes.py`) and their Portuguese texts:
| Code | Message (English) | Portuguese (frontend) |
|---|---|---|
| `amount.not_positive` | The amount must be greater than zero. | O valor deve ser maior que zero. |
| `account_payable.amount.not_positive` | The amount must be greater than zero. | O valor deve ser maior que zero. |
| `account_payable.amount_paid.not_positive` | The amount paid must be greater than zero. | O valor pago deve ser maior que zero. |
| `account_payable.due_date.before_issue_date` | The due date cannot be before the issue date. | O vencimento não pode ser anterior à emissão. |
| `account_payable.cost_center.required_for_condominium` | An expense of a condominium needs a cost center. | A despesa de um condomínio precisa de um centro de custo. |
| `account_payable.cost_center.not_allowed_for_company_expense` | A company expense has no cost center. | Despesa da empresa não tem centro de custo. |
| `account_payable.cost_center.other_condominium` | The cost center belongs to another condominium. | O centro de custo pertence a outro condomínio. |
| `account_payable.condominium.other_company` | The condominium belongs to another company. | O condomínio pertence a outra empresa. |
| `account_payable.supplier.other_company` | The supplier belongs to another company. | O fornecedor pertence a outra empresa. |
| `account_payable.payment.required_when_paid` | A paid account needs the payment date, amount and method. | Uma conta paga precisa de data, valor e forma de pagamento. |
| `account_payable.payment.not_allowed_unless_paid` | Only a paid account has payment data. | Só uma conta paga tem dados de pagamento. |
| `account_payable.status.not_open` | Only an open account payable can be changed, settled or cancelled. | Só uma conta a pagar em aberto pode ser alterada, baixada ou cancelada. |
| `account_payable.deletion.is_paid` | A paid account payable cannot be deleted. | Uma conta a pagar paga não pode ser excluída. |

## A — Approach
- **Same pattern as specs 009 and 010:** `ModelRulesMixin` serializers (no rules inside), `CompanyScopedViewSetMixin` viewset, `DefaultRouter` entry `accounts-payable`, one entity per file. `company` is set from the user on create (`request_company`); the rules see it through the mixin.
- **The life cycle is a model concern.** `settle()` and `cancel()` live on `AccountPayable` so every caller (API, Admin, later the ledger posting of part 05, tasks) shares one transactional path; the actions in the viewset only parse input (`SettleSerializer`) and call them. A Django `ValidationError` raised there becomes the usual 400 (spec 009's handler).
- **Closed means closed.** `clean()` loads the stored status; if it is not `open` the save is refused with `account_payable.status.not_open`. `settle()` and `cancel()` change an `open` row, so they pass; re-saving a paid row does not. The same method refuses a second settle or a settle after a cancel.
- **Cross-record rules** (`cost_center` ↔ `condominium`, `condominium` ↔ `company`, `supplier` ↔ `company`) are `clean()` rules with codes; the database constraints guard what one row can express (amounts, dates, the cost-center/condominium pairing, the payment fields).
- **History** is the audit trail (`register_audited(AccountPayable)`): every create, edit, settle and cancel is logged with the actor, including old and new amount and due date.
- **Rejected:** a `GenericForeignKey` holder; storing the receipt now (no storage, no host); a "reopen" transition now (it needs the ledger reversal, part 05); a separate `Payment` table (one settlement per account in this model; the PDF has one payment per account).

## S — Structure
| File | Change |
|---|---|
| `apps/finance/models/account_payable.py`, `models/__init__.py` | new model, constants, `settle()`, `cancel()`, `delete()` rule |
| `apps/finance/validators.py`, `error_codes.py` | `validate_positive_amount`; the codes above |
| `apps/finance/audit.py` | register `AccountPayable` |
| `apps/finance/serializers/account_payable_serializers.py` | `AccountPayableSerializer`, `SettleAccountPayableSerializer` |
| `apps/finance/views/account_payable_views.py` | `AccountPayableViewSet` with the `settle` and `cancel` actions |
| `apps/finance/filters.py` | `AccountPayableFilter` (date range, `is_company_expense`) |
| `apps/finance/urls.py`, `admin.py` | route `accounts-payable`; `AccountPayableAdmin` |
| `apps/finance/migrations/0005_accounts_payable.py` | the table, indexes and constraints |
| `apps/finance/tests/test_accounts_payable.py`, `test_account_payable_rules.py`, `test_admin.py` (extend) | tests |
| `frontend/lib/error-messages.ts`, `frontend/lib/api/generated/` | texts; regenerated client |
| `docs/apps/finance.md`, `architecture/data.md`, `architecture/api.md`; `roadmap/phase-3-finance-base/` | docs; parts 06 and 07 added |
Endpoints:
| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/api/accounts-payable/` | `?status=&supplier=&condominium=&cost_center=&due_date_after=&due_date_before=&is_company_expense=&query=&page=&limit=` | paginated accounts | scoped to the user's company |
| POST | `/api/accounts-payable/` | `{supplier, condominium?, cost_center?, description, document_number?, amount, issue_date?, due_date}` | 201 (`status` = `open`) | `company` = the user's |
| GET / PATCH / DELETE | `/api/accounts-payable/{id}/` | - / partial / - | account / 204 | PATCH only while `open`; DELETE not for a `paid` one |
| POST | `/api/accounts-payable/{id}/settle/` | `{payment_date, amount_paid, payment_method}` | 200 the account (`paid`) | 400 `account_payable.status.not_open` otherwise |
| POST | `/api/accounts-payable/{id}/cancel/` | `{}` | 200 the account (`cancelled`) | 400 `account_payable.status.not_open` otherwise |
Money is serialized as a string (`"1250.00"`), as everywhere in the API.

## O — Operations
Depends on specs 009 and 010 (done) and phase 3a.
1. Validator, codes, model with constraints, `settle()`/`cancel()`/`delete()`; migration; model tests.
2. Audit registration; serializers; viewset actions; filter; urls; API tests.
3. Admin; admin tests.
4. Frontend: Portuguese texts, regenerate the client, `tsc`/`eslint`/`build`.
5. Docs; roadmap (parts 06 and 07 exist), spec and part to `done`.

## N — Norms
`conventions/practices.md` (rules only in models, a code with every rule, atomic multi-step writes), `architecture/api.md` (money as strings, actions with `@extend_schema`), `conventions/naming.md` (`settle`, `cancel` are verbs; codes `model.field.reason`), `architecture/structure.md`.

## S — Safeguards
- **Money:** `DecimalField(12, 2)` only; never floats; the amounts shown in responses are strings; positive amounts are a validator, a model rule and a constraint.
- **Integrity:** the status machine is guarded in the model and by the payment-fields constraint; settling and cancelling run in `transaction.atomic()` with the row locked (`select_for_update()` on the stored row) so two simultaneous settles cannot both succeed.
- **Company isolation:** `company_lookup = "company"`; foreign ids are 400 `does_not_exist`; another company's records are 404; a condominium, cost center and supplier of another company are rejected by `clean()` too (Admin and code).
- **Audit:** every change is logged with the actor (amounts are not secret, so nothing is masked); closed accounts cannot be edited, so the log of a paid account ends with its settlement.
- **Backward compatibility:** a new resource and table; no existing field changes; the client is regenerated.
- **Known limit:** until part 05 settling only marks the account; no ledger entry exists yet, so the current account does not move (the roadmap order keeps part 05 before any screen or go-live).
- **Failure modes:** deleting a supplier, cost center, condominium or company that an account references is refused by `PROTECT` and answers 500 today (known gap #27).

## Test plan
Every criterion maps to at least one test. A gap is written down, never left out.
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_accounts_payable.py::test_crud`, `::test_filters`, `::test_search`, `::test_list_is_paginated_and_ordered_by_due_date`, `::test_requires_authentication` |
| R2 | `apps/finance/tests/test_accounts_payable.py::test_a_new_account_is_open_and_company_is_the_users`, `::test_status_and_payment_fields_are_read_only` |
| R3 | `apps/finance/tests/test_account_payable_rules.py::test_amount_must_be_positive`, `::test_due_date_cannot_be_before_issue_date`, `::test_the_database_refuses_a_non_positive_amount`, `::test_the_database_refuses_due_before_issue` |
| R4 | `apps/finance/tests/test_account_payable_rules.py::test_condominium_expense_needs_a_cost_center`, `::test_company_expense_has_no_cost_center`, `::test_a_company_expense_without_condominium_is_valid`, `::test_cost_center_must_belong_to_the_condominium`, `::test_condominium_and_supplier_must_belong_to_the_company`, `::test_the_database_pairs_the_cost_center_with_the_condominium` |
| R5 | `apps/finance/tests/test_accounts_payable.py::test_settle`, `::test_amount_paid_may_differ_from_the_amount`, `::test_settle_needs_a_positive_amount_paid`, `::test_settle_needs_all_the_fields`, `::test_settle_rejects_an_unknown_method`, `apps/finance/tests/test_account_payable_rules.py::test_settle_is_atomic` (the row lock is not exercised by a concurrency test: gap, it needs two transactions) |
| R6 | `apps/finance/tests/test_accounts_payable.py::test_cancel` |
| R7 | `apps/finance/tests/test_account_payable_rules.py::test_a_paid_account_cannot_be_edited_settled_or_cancelled`, `::test_a_cancelled_account_cannot_be_settled`, `::test_a_paid_account_cannot_be_deleted`, `::test_an_open_account_can_be_deleted`, `::test_a_cancelled_account_can_be_deleted`, `::test_model_save_of_a_closed_account_is_refused` |
| R8 | `apps/finance/tests/test_account_payable_rules.py::test_payment_fields_only_when_paid`, `::test_the_database_refuses_inconsistent_payment_fields` |
| R9 | `apps/finance/tests/test_accounts_payable.py::test_other_company_is_404_and_foreign_ids_are_does_not_exist`; the guard tests of `apps/core/tests/test_company_scoping.py` |
| R10 | `apps/finance/tests/test_admin.py::test_account_payable_admin_is_company_scoped`, `apps/finance/tests/test_account_payable_rules.py::test_changes_of_amount_and_due_date_are_in_the_audit_log` (with a real JWT: `conftest.py::jwt_api_client`) |
| R11 | `apps/core/tests/test_error_codes.py` (registered, constraint and `ValidationError` guards); the TypeScript compile failed before the 13 texts existed and passes after; the client has `accounts-payable` |
| R12 | gap: documentation has no test; checked by review and `python backend/docs/tools/check_docs.py` |

## Definition of done
<!-- Tick every box before Status becomes done; the checker rejects a done spec with an unticked box. Write `N/A — reason` instead of deleting a line. -->
- [x] Every criterion R1… has a passing test in the Test plan
- [x] `pytest apps -q` green; `mypy apps config` clean; `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`manage.py spectacular` → `npx orval --input`; `npx tsc --noEmit`, `npx eslint .`, `npm run build`)
- [x] `docs/apps/finance.md`, `architecture/data.md`, `architecture/api.md` updated
- [x] Roadmap part 03 of phase 3 and the index in `features/README.md` updated
