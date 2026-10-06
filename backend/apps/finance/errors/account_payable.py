from apps.core.errors.base import RuleError


class AccountPayableError(RuleError):
    AMOUNT_NOT_POSITIVE = (
        "account_payable.amount.not_positive",
        "The amount must be greater than zero.",
    )
    AMOUNT_PAID_NOT_POSITIVE = (
        "account_payable.amount_paid.not_positive",
        "The amount paid must be greater than zero.",
    )
    DUE_DATE_BEFORE_ISSUE_DATE = (
        "account_payable.due_date.before_issue_date",
        "The due date cannot be before the issue date.",
    )
    COST_CENTER_REQUIRED_FOR_CONDOMINIUM = (
        "account_payable.cost_center.required_for_condominium",
        "An expense of a condominium needs a cost center.",
    )
    COST_CENTER_NOT_ALLOWED_FOR_COMPANY_EXPENSE = (
        "account_payable.cost_center.not_allowed_for_company_expense",
        "A company expense has no cost center.",
    )
    COST_CENTER_OTHER_CONDOMINIUM = (
        "account_payable.cost_center.other_condominium",
        "The cost center belongs to another condominium.",
    )
    CONDOMINIUM_OTHER_COMPANY = (
        "account_payable.condominium.other_company",
        "The condominium belongs to another company.",
    )
    SUPPLIER_OTHER_COMPANY = (
        "account_payable.supplier.other_company",
        "The supplier belongs to another company.",
    )
    PAYMENT_REQUIRED_WHEN_PAID = (
        "account_payable.payment.required_when_paid",
        "A paid account needs the payment date, amount and method.",
    )
    PAYMENT_NOT_ALLOWED_UNLESS_PAID = (
        "account_payable.payment.not_allowed_unless_paid",
        "Only a paid account has payment data.",
    )
    STATUS_NOT_OPEN = (
        "account_payable.status.not_open",
        "Only an open account payable can be changed, settled or cancelled.",
    )
    DELETION_IS_PAID = (
        "account_payable.deletion.is_paid",
        "A paid account payable cannot be deleted.",
    )
    ENTRY_TEMPLATE_NOT_ALLOWED_FOR_COMPANY_EXPENSE = (
        "account_payable.entry_template.not_allowed_for_company_expense",
        "A company expense has no entry template.",
    )
    ENTRY_TEMPLATE_OTHER_COST_CENTER = (
        "account_payable.entry_template.other_cost_center",
        "The entry template belongs to another cost center.",
    )
    ENTRY_TEMPLATE_REQUIRED_TO_PAY = (
        "account_payable.entry_template.required_to_pay",
        "An expense of a condominium needs an entry template to be paid.",
    )
