---
summary: Plan and status of part 02 of phase 3 — Suppliers and bank accounts.
read-when: you work on suppliers and bank accounts or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 02 — Suppliers and bank accounts

**Status:** done · **Phase:** 3 (Finance base) · **Apps:** finance · **Frontend impact:** client regeneration · **Depends on:** 01
**Spec:** [010 — Suppliers and bank accounts](../../features/010-suppliers-and-bank-accounts.md)

## Goal
Who the company pays and which real bank accounts exist.

## Scope
- [x] Model + API: `Supplier` (a `Person` with supplier role + bank data or PIX key)
- [x] Model + API: `BankAccount` (holder = company; condominium only in the own-account exception)
- [x] Admin for both

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-05 (spec 010 `done`). `Supplier` (1:1 with `Person`, optional payment data: bank code, branch, account number, kind, PIX key; filled together or not at all) and `BankAccount` (the company's real accounts; `condominium` set only for a condominium's own account) with `/api/suppliers/` and `/api/bank-accounts/`, Django Admin, company scoping, and the bank data **masked** in the audit log. Migration `finance.0004`.
Decisions worth remembering: no `Condominium.own_bank_account` (it would make `condominiums` depend on `finance`; the condominium's account is `condominium.bank_accounts`); `company` is always set on an account and `condominium` is optional (one scope path); which account receives a boleto is decided in phase 4.
Frontend: four Portuguese texts and the regenerated client (no screen). Checked: `pytest apps -q` 456 passed, `mypy apps config` clean, `tsc`/`eslint`/`build` clean.