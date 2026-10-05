"""Stable error codes of the finance rules (spec 006): `model.field.reason`."""

from enum import StrEnum


class FinanceErrorCode(StrEnum):
    AMOUNT_NOT_POSITIVE = "amount.not_positive"
    ACCOUNT_PAYABLE_AMOUNT_NOT_POSITIVE = "account_payable.amount.not_positive"
    ACCOUNT_PAYABLE_AMOUNT_PAID_NOT_POSITIVE = "account_payable.amount_paid.not_positive"
    ACCOUNT_PAYABLE_DUE_DATE_BEFORE_ISSUE_DATE = "account_payable.due_date.before_issue_date"
    ACCOUNT_PAYABLE_COST_CENTER_REQUIRED_FOR_CONDOMINIUM = "account_payable.cost_center.required_for_condominium"
    ACCOUNT_PAYABLE_COST_CENTER_NOT_ALLOWED_FOR_COMPANY_EXPENSE = "account_payable.cost_center.not_allowed_for_company_expense"
    ACCOUNT_PAYABLE_COST_CENTER_OTHER_CONDOMINIUM = "account_payable.cost_center.other_condominium"
    ACCOUNT_PAYABLE_CONDOMINIUM_OTHER_COMPANY = "account_payable.condominium.other_company"
    ACCOUNT_PAYABLE_SUPPLIER_OTHER_COMPANY = "account_payable.supplier.other_company"
    ACCOUNT_PAYABLE_PAYMENT_REQUIRED_WHEN_PAID = "account_payable.payment.required_when_paid"
    ACCOUNT_PAYABLE_PAYMENT_NOT_ALLOWED_UNLESS_PAID = "account_payable.payment.not_allowed_unless_paid"
    ACCOUNT_PAYABLE_STATUS_NOT_OPEN = "account_payable.status.not_open"
    ACCOUNT_PAYABLE_DELETION_IS_PAID = "account_payable.deletion.is_paid"
    BANK_CODE_INVALID_FORMAT = "bank_code.invalid_format"
    BANK_ACCOUNT_ACCOUNT_NUMBER_DUPLICATE_FOR_HOLDER = "bank_account.account_number.duplicate_for_holder"
    BANK_ACCOUNT_CONDOMINIUM_OTHER_COMPANY = "bank_account.condominium.other_company"
    SUPPLIER_BANK_DATA_INCOMPLETE = "supplier.bank_data.incomplete"
    COST_CENTER_CONDOMINIUM_IMMUTABLE = "cost_center.condominium.immutable"
    COST_CENTER_DELETION_HAS_ENTRY_TEMPLATES = "cost_center.deletion.has_entry_templates"
    COST_CENTER_NAME_DUPLICATE_IN_CONDOMINIUM = "cost_center.name.duplicate_in_condominium"
    ENTRY_TEMPLATE_ADMIN_FEE_PERCENTAGE_OUT_OF_RANGE = "entry_template.admin_fee_incidence_percentage.out_of_range"
    ENTRY_TEMPLATE_COST_CENTER_IMMUTABLE = "entry_template.cost_center.immutable"
    ENTRY_TEMPLATE_NAME_DUPLICATE_IN_COST_CENTER = "entry_template.name.duplicate_in_cost_center"
