from typing import TYPE_CHECKING, Any

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import AccountPayableError

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models import Condominium
    from apps.finance.models.account_payable import AccountPayable  # noqa: F401
    from apps.finance.models.cost_center import CostCenter
    from apps.finance.models.supplier import Supplier


class AccountPayableRules(ModelRules["AccountPayable"]):
    """A closed account never changes: the model's `clean()` checks that precondition before these rules."""

    @rule("cost_center", AccountPayableError.COST_CENTER_NOT_ALLOWED_FOR_COMPANY_EXPENSE)
    def company_expense_has_cost_center(self) -> bool:
        return self._condominium() is None and self._cost_center() is not None

    @rule("cost_center", AccountPayableError.COST_CENTER_REQUIRED_FOR_CONDOMINIUM)
    def condominium_expense_lacks_cost_center(self) -> bool:
        return self._condominium() is not None and self._cost_center() is None

    @rule("cost_center", AccountPayableError.COST_CENTER_OTHER_CONDOMINIUM)
    def cost_center_belongs_to_another_condominium(self) -> bool:
        condominium, cost_center = self._condominium(), self._cost_center()
        return (
            condominium is not None
            and cost_center is not None
            and cost_center.condominium_id != condominium.pk
        )

    @rule("entry_template", AccountPayableError.ENTRY_TEMPLATE_NOT_ALLOWED_FOR_COMPANY_EXPENSE)
    def company_expense_has_entry_template(self) -> bool:
        return self._condominium() is None and self.instance.entry_template_id is not None

    @rule("entry_template", AccountPayableError.ENTRY_TEMPLATE_OTHER_COST_CENTER)
    def entry_template_belongs_to_another_cost_center(self) -> bool:
        account = self.instance
        if account.entry_template_id is None or account.cost_center_id is None:
            return False
        return account.entry_template.cost_center_id != account.cost_center_id

    @rule("entry_template", AccountPayableError.ENTRY_TEMPLATE_REQUIRED_TO_PAY)
    def paid_condominium_expense_lacks_entry_template(self) -> bool:
        return self._is_paid() and self._condominium() is not None and self.instance.entry_template_id is None

    @rule("condominium", AccountPayableError.CONDOMINIUM_OTHER_COMPANY)
    def condominium_belongs_to_another_company(self) -> bool:
        condominium = self._condominium()
        company_id = self.instance.company_id
        return condominium is not None and company_id is not None and condominium.company_id != company_id

    @rule("supplier", AccountPayableError.SUPPLIER_OTHER_COMPANY)
    def supplier_belongs_to_another_company(self) -> bool:
        supplier = self._supplier()
        company_id = self.instance.company_id
        return supplier is not None and company_id is not None and supplier.person.company_id != company_id

    @rule("payment_date", AccountPayableError.PAYMENT_REQUIRED_WHEN_PAID)
    def paid_without_payment_date(self) -> bool:
        return self._is_paid() and _is_blank(self.instance.payment_date)

    @rule("amount_paid", AccountPayableError.PAYMENT_REQUIRED_WHEN_PAID)
    def paid_without_amount_paid(self) -> bool:
        return self._is_paid() and _is_blank(self.instance.amount_paid)

    @rule("payment_method", AccountPayableError.PAYMENT_REQUIRED_WHEN_PAID)
    def paid_without_payment_method(self) -> bool:
        return self._is_paid() and _is_blank(self.instance.payment_method)

    @rule("payment_date", AccountPayableError.PAYMENT_NOT_ALLOWED_UNLESS_PAID)
    def unpaid_with_payment_date(self) -> bool:
        return not self._is_paid() and not _is_blank(self.instance.payment_date)

    @rule("amount_paid", AccountPayableError.PAYMENT_NOT_ALLOWED_UNLESS_PAID)
    def unpaid_with_amount_paid(self) -> bool:
        return not self._is_paid() and not _is_blank(self.instance.amount_paid)

    @rule("payment_method", AccountPayableError.PAYMENT_NOT_ALLOWED_UNLESS_PAID)
    def unpaid_with_payment_method(self) -> bool:
        return not self._is_paid() and not _is_blank(self.instance.payment_method)

    @rule("due_date", AccountPayableError.DUE_DATE_BEFORE_ISSUE_DATE)
    def due_date_is_before_issue_date(self) -> bool:
        account = self.instance
        return account.issue_date is not None and account.due_date is not None and account.due_date < account.issue_date

    def _is_paid(self) -> bool:
        return self.instance.status == self.instance.Status.PAID

    def _condominium(self) -> "Condominium | None":
        account = self.instance
        return account.condominium if account.condominium_id is not None else None

    def _cost_center(self) -> "CostCenter | None":
        account = self.instance
        return account.cost_center if account.cost_center_id is not None else None

    def _supplier(self) -> "Supplier | None":
        account = self.instance
        return account.supplier if account.supplier_id is not None else None


def _is_blank(value: Any) -> bool:
    return value in (None, "")
