from typing import Any

from django.db import models
from django.db.models import F, Q
from typing_extensions import final, override

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.core.models.base import BaseModel
from apps.finance.errors import AccountPayableError
from apps.finance.models.querysets import AccountPayableQuerySet
from apps.finance.models.rules import AccountPayableRules
from apps.finance.validators import validate_positive_amount

from .cost_center import CostCenter
from .supplier import Supplier


@final
class AccountPayable(BaseModel):
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

    objects = AccountPayableQuerySet.as_manager()

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
                violation_error_message=AccountPayableError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=AccountPayableError.AMOUNT_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="account_payable_amount_paid_positive",
                condition=Q(amount_paid__isnull=True) | Q(amount_paid__gt=0),
                violation_error_message=AccountPayableError.AMOUNT_PAID_NOT_POSITIVE.message,
                violation_error_code=AccountPayableError.AMOUNT_PAID_NOT_POSITIVE.value,
            ),
            models.CheckConstraint(
                name="account_payable_due_after_issue",
                condition=Q(issue_date__isnull=True) | Q(due_date__gte=F("issue_date")),
                violation_error_message=AccountPayableError.DUE_DATE_BEFORE_ISSUE_DATE.message,
                violation_error_code=AccountPayableError.DUE_DATE_BEFORE_ISSUE_DATE.value,
            ),
            models.CheckConstraint(
                name="account_payable_cost_center_pairs_condominium",
                condition=(Q(condominium__isnull=True) & Q(cost_center__isnull=True))
                | (Q(condominium__isnull=False) & Q(cost_center__isnull=False)),
                violation_error_message=AccountPayableError.COST_CENTER_REQUIRED_FOR_CONDOMINIUM.message,
                violation_error_code=AccountPayableError.COST_CENTER_REQUIRED_FOR_CONDOMINIUM.value,
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
                violation_error_message=AccountPayableError.PAYMENT_REQUIRED_WHEN_PAID.message,
                violation_error_code=AccountPayableError.PAYMENT_REQUIRED_WHEN_PAID.value,
            ),
        )

    @override
    def clean(self) -> None:
        """A closed account never changes."""
        if not self._state.adding:
            stored_status = (
                type(self).objects.filter(pk=self.pk).values_list("status", flat=True).first()
            )
            if stored_status is not None and stored_status != self.Status.OPEN:
                raise AccountPayableError.STATUS_NOT_OPEN.to_validation_error()
        AccountPayableRules(self).validate()

    def lock_for_change(self) -> None:
        """Lock the stored row so two simultaneous changes cannot both succeed; it must be open.

        Call it inside a transaction (the settle and cancel services do): it also reloads the instance.
        """
        stored = type(self).objects.select_for_update().get(pk=self.pk)
        if stored.status != self.Status.OPEN:
            raise AccountPayableError.STATUS_NOT_OPEN.to_validation_error()
        self.refresh_from_db()

    @override
    def delete(self, *args: Any, **kwargs: Any) -> tuple[int, dict[str, int]]:
        if self.status == self.Status.PAID:
            raise AccountPayableError.DELETION_IS_PAID.to_validation_error()
        return super().delete(*args, **kwargs)

    @override
    def __str__(self) -> str:
        return f"{self.description} ({self.due_date})"
