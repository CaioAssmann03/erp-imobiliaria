import uuid
from datetime import date
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.error_codes import FinanceErrorCode as Code
from apps.finance.validators import validate_positive_amount

from .cost_center import CostCenter
from .supplier import Supplier

AMOUNT_POSITIVE = "The amount must be greater than zero."
AMOUNT_PAID_POSITIVE = "The amount paid must be greater than zero."
DUE_BEFORE_ISSUE = "The due date cannot be before the issue date."
COST_CENTER_REQUIRED = "An expense of a condominium needs a cost center."
COST_CENTER_NOT_ALLOWED = "A company expense has no cost center."
COST_CENTER_OTHER_CONDOMINIUM = "The cost center belongs to another condominium."
CONDOMINIUM_OTHER_COMPANY = "The condominium belongs to another company."
SUPPLIER_OTHER_COMPANY = "The supplier belongs to another company."
PAYMENT_REQUIRED = "A paid account needs the payment date, amount and method."
PAYMENT_NOT_ALLOWED = "Only a paid account has payment data."
STATUS_NOT_OPEN = "Only an open account payable can be changed, settled or cancelled."
DELETION_IS_PAID = "A paid account payable cannot be deleted."


def _rule(message: str, code: Code) -> ValidationError:
    return ValidationError(message, code=code.value)


class AccountPayableQuerySet(models.QuerySet["AccountPayable"]):
    """Reusable filters over the open accounts (the dashboard and, later, the screens use them)."""

    def open(self) -> "AccountPayableQuerySet":
        return self.filter(status=AccountPayable.Status.OPEN)

    def overdue(self, reference_date: date) -> "AccountPayableQuerySet":
        """Open accounts whose due date is before `reference_date`."""
        return self.open().filter(due_date__lt=reference_date)

    def due_between(self, first_day: date, last_day: date) -> "AccountPayableQuerySet":
        """Open accounts due from `first_day` to `last_day`, both included."""
        return self.open().filter(due_date__gte=first_day, due_date__lte=last_day)


@final
class AccountPayable(models.Model):
    """An expense to pay (the PDF's *ContaPagar*) of a condominium or of the company itself.

    It is `open` until it is settled ("baixa") or cancelled; a closed account never changes again.
    """

    class Status(models.TextChoices):
        OPEN = ("open", "Open")
        PAID = ("paid", "Paid")
        CANCELLED = ("cancelled", "Cancelled")

    class PaymentMethod(models.TextChoices):
        BOLETO = ("boleto", "Boleto")
        PIX = ("pix", "Pix")
        AUTOMATIC_DEBIT = ("automatic_debit", "Automatic debit")
        TRANSFER = ("transfer", "Transfer")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # `company` owns the expense; `condominium` is set when it is a condominium's expense.
    company = models.ForeignKey(Company, on_delete=models.PROTECT, related_name="accounts_payable")
    condominium = models.ForeignKey(
        Condominium,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="accounts_payable",
    )
    cost_center = models.ForeignKey(
        CostCenter,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="accounts_payable",
    )
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="accounts_payable")

    description = models.CharField(max_length=255)
    document_number = models.CharField(max_length=60, blank=True, help_text="Invoice number or the supplier's barcode")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[validate_positive_amount])
    issue_date = models.DateField(null=True, blank=True)
    due_date = models.DateField()

    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    payment_date = models.DateField(null=True, blank=True)
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[validate_positive_amount],
    )
    payment_method = models.CharField(max_length=20, blank=True, choices=PaymentMethod.choices)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AccountPayableQuerySet.as_manager()

    # Path from the model to its company (spec 004: company scoping).
    company_lookup = "company"

    class Meta:
        verbose_name = "Account Payable"
        verbose_name_plural = "Accounts Payable"
        ordering = ("due_date", "-created_at")
        indexes = (models.Index(fields=("status", "due_date"), name="account_payable_status_due"),)
        constraints = (
            models.CheckConstraint(
                name="account_payable_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=AMOUNT_POSITIVE,
                violation_error_code=Code.ACCOUNT_PAYABLE_AMOUNT_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="account_payable_amount_paid_positive",
                condition=Q(amount_paid__isnull=True) | Q(amount_paid__gt=0),
                violation_error_message=AMOUNT_PAID_POSITIVE,
                violation_error_code=Code.ACCOUNT_PAYABLE_AMOUNT_PAID_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="account_payable_due_after_issue",
                condition=Q(issue_date__isnull=True) | Q(due_date__gte=F("issue_date")),
                violation_error_message=DUE_BEFORE_ISSUE,
                violation_error_code=Code.ACCOUNT_PAYABLE_DUE_DATE_BEFORE_ISSUE_DATE.value,
            ),
            models.CheckConstraint(
                name="account_payable_cost_center_pairs_condominium",
                condition=(Q(condominium__isnull=True) & Q(cost_center__isnull=True))
                | (Q(condominium__isnull=False) & Q(cost_center__isnull=False)),
                violation_error_message=COST_CENTER_REQUIRED,
                violation_error_code=Code.ACCOUNT_PAYABLE_COST_CENTER_REQUIRED_FOR_CONDOMINIUM.value,
            ),
            models.CheckConstraint(
                name="account_payable_payment_only_when_paid",
                condition=(
                    Q(status="paid")
                    & Q(payment_date__isnull=False)
                    & Q(amount_paid__isnull=False)
                    & ~Q(payment_method="")
                )
                | (
                    ~Q(status="paid")
                    & Q(payment_date__isnull=True)
                    & Q(amount_paid__isnull=True)
                    & Q(payment_method="")
                ),
                violation_error_message=PAYMENT_REQUIRED,
                violation_error_code=Code.ACCOUNT_PAYABLE_PAYMENT_REQUIRED_WHEN_PAID.value,
            ),
        )

    # ----- rules -----

    @override
    def clean(self) -> None:
        """Closed accounts never change; the rest are the cross-record and payment rules."""
        if not self._state.adding:
            stored_status = (
                type(self).objects.filter(pk=self.pk).values_list("status", flat=True).first()
            )
            if stored_status is not None and stored_status != self.Status.OPEN:
                raise _rule(STATUS_NOT_OPEN, Code.ACCOUNT_PAYABLE_STATUS_NOT_OPEN)
        errors: dict[str, ValidationError] = {}
        errors.update(self._holder_errors())
        errors.update(self._payment_errors())
        if self.issue_date is not None and self.due_date is not None and self.due_date < self.issue_date:
            errors["due_date"] = _rule(DUE_BEFORE_ISSUE, Code.ACCOUNT_PAYABLE_DUE_DATE_BEFORE_ISSUE_DATE)
        if errors:
            raise ValidationError(errors)

    def _holder_errors(self) -> dict[str, ValidationError]:
        errors: dict[str, ValidationError] = {}
        condominium = self.condominium if self.condominium_id is not None else None
        cost_center = self.cost_center if self.cost_center_id is not None else None
        supplier = self.supplier if self.supplier_id is not None else None
        if condominium is None and cost_center is not None:
            errors["cost_center"] = _rule(
                COST_CENTER_NOT_ALLOWED, Code.ACCOUNT_PAYABLE_COST_CENTER_NOT_ALLOWED_FOR_COMPANY_EXPENSE
            )
        if condominium is not None:
            if cost_center is None:
                errors["cost_center"] = _rule(
                    COST_CENTER_REQUIRED, Code.ACCOUNT_PAYABLE_COST_CENTER_REQUIRED_FOR_CONDOMINIUM
                )
            elif cost_center.condominium_id != condominium.pk:
                errors["cost_center"] = _rule(
                    COST_CENTER_OTHER_CONDOMINIUM, Code.ACCOUNT_PAYABLE_COST_CENTER_OTHER_CONDOMINIUM
                )
            if self.company_id is not None and condominium.company_id != self.company_id:
                errors["condominium"] = _rule(
                    CONDOMINIUM_OTHER_COMPANY, Code.ACCOUNT_PAYABLE_CONDOMINIUM_OTHER_COMPANY
                )
        if supplier is not None and self.company_id is not None:
            if supplier.person.company_id != self.company_id:
                errors["supplier"] = _rule(SUPPLIER_OTHER_COMPANY, Code.ACCOUNT_PAYABLE_SUPPLIER_OTHER_COMPANY)
        return errors

    def _payment_errors(self) -> dict[str, ValidationError]:
        """The payment fields are filled exactly when the account is paid."""
        payment = {
            "payment_date": self.payment_date,
            "amount_paid": self.amount_paid,
            "payment_method": self.payment_method,
        }
        if self.status == self.Status.PAID:
            return {
                field: _rule(PAYMENT_REQUIRED, Code.ACCOUNT_PAYABLE_PAYMENT_REQUIRED_WHEN_PAID)
                for field, value in payment.items()
                if value in (None, "")
            }
        return {
            field: _rule(PAYMENT_NOT_ALLOWED, Code.ACCOUNT_PAYABLE_PAYMENT_NOT_ALLOWED_UNLESS_PAID)
            for field, value in payment.items()
            if value not in (None, "")
        }

    # ----- life cycle -----

    def settle(self, payment_date: date, amount_paid: Decimal, payment_method: str) -> None:
        """Pay ("baixa") an open account, atomically; the ledger entry of phase 3 part 05 joins here."""
        with transaction.atomic():
            self._lock_open()
            self.status = self.Status.PAID
            self.payment_date = payment_date
            self.amount_paid = amount_paid
            self.payment_method = payment_method
            self.full_clean()
            self.save()

    def cancel(self) -> None:
        """Cancel an open account, atomically."""
        with transaction.atomic():
            self._lock_open()
            self.status = self.Status.CANCELLED
            self.full_clean()
            self.save()

    def _lock_open(self) -> None:
        """Lock the stored row so two simultaneous changes cannot both succeed; it must be open."""
        stored = type(self).objects.select_for_update().get(pk=self.pk)
        if stored.status != self.Status.OPEN:
            raise _rule(STATUS_NOT_OPEN, Code.ACCOUNT_PAYABLE_STATUS_NOT_OPEN)
        self.refresh_from_db()

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        """A paid account is history and cannot be deleted."""
        if self.status == self.Status.PAID:
            raise _rule(DELETION_IS_PAID, Code.ACCOUNT_PAYABLE_DELETION_IS_PAID)
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.description} ({self.due_date})"
