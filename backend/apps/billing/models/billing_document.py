from datetime import date
from typing import TYPE_CHECKING, ClassVar, final, override

from django.db import models
from django.db.models import Q

from apps.billing.errors import BillingDocumentError
from apps.billing.models.querysets import BillingDocumentQuerySet
from apps.billing.models.rules import BillingDocumentRules
from apps.billing.validators import validate_first_day_of_month
from apps.condominiums.models import BillingRules, Unit
from apps.core.models.base import BaseModel
from apps.core.validators import validate_percentage
from apps.finance.errors import FinanceValidatorError
from apps.finance.validators import validate_positive_amount
from apps.persons.models import Person

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .billing_document_item import BillingDocumentItem


@final
class BillingDocument(BaseModel):
    """The monthly boleto of a unit as a business record (the PDF's *DocumentoCobranca*).

    The bank or gateway fields (our number, digitable line, barcode) are not here: they change on every
    reissue. The late-payment and discount terms are copied from the condominium's rules at issuance,
    so changing the rules later does not alter a boleto already issued.
    """

    class Status(models.TextChoices):
        ISSUED = ("issued", "Issued")
        REGISTERED = ("registered", "Registered")
        PAID = ("paid", "Paid")
        CANCELLED = ("cancelled", "Cancelled")

    # Overdue is derived from the due date (`overdue_on`), not stored.
    AWAITING_PAYMENT_STATUSES: ClassVar[tuple[str, ...]] = (Status.ISSUED, Status.REGISTERED)
    ALLOWED_NEXT_STATUSES: ClassVar[dict[str, tuple[str, ...]]] = {
        Status.ISSUED: (Status.REGISTERED, Status.CANCELLED),
        Status.REGISTERED: (Status.PAID, Status.CANCELLED),
        Status.PAID: (),
        Status.CANCELLED: (),
    }

    if TYPE_CHECKING:
        items: "RelatedManager[BillingDocumentItem]"

    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="billing_documents")
    payer = models.ForeignKey(Person, on_delete=models.PROTECT, related_name="billing_documents")
    reference_month = models.DateField(validators=[validate_first_day_of_month])
    competence_month = models.DateField(validators=[validate_first_day_of_month])
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[validate_positive_amount])
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ISSUED)

    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[validate_percentage]
    )
    discount_days = models.PositiveSmallIntegerField(default=0)
    late_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    initial_late_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    initial_late_fee_days = models.PositiveSmallIntegerField(null=True, blank=True)
    interest_calculation = models.CharField(max_length=12, choices=BillingRules.InterestCalculation.choices)
    interest_grace_days = models.PositiveSmallIntegerField(default=0)
    # 0 when the condominium had no late interest rate in force on the due date.
    monthly_interest_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, validators=[validate_percentage]
    )

    company_lookup = "unit__condominium__company"

    objects = BillingDocumentQuerySet.as_manager()

    class Meta:
        verbose_name = "Billing Document"
        verbose_name_plural = "Billing Documents"
        ordering = ("-reference_month", "unit__condominium__name", "unit__name")
        constraints = (
            models.UniqueConstraint(
                fields=("unit", "reference_month"),
                condition=~Q(status="cancelled"),
                name="billing_document_unique_reference_month_per_unit",
                violation_error_message=BillingDocumentError.REFERENCE_MONTH_DUPLICATE_FOR_UNIT.message,
                violation_error_code=BillingDocumentError.REFERENCE_MONTH_DUPLICATE_FOR_UNIT.value,
            ),
            models.CheckConstraint(
                name="billing_document_amount_positive",
                condition=Q(amount__gt=0),
                violation_error_message=FinanceValidatorError.AMOUNT_NOT_POSITIVE.message,
                violation_error_code=FinanceValidatorError.AMOUNT_NOT_POSITIVE.value,
            ),
        )

    def is_overdue_on(self, reference_date: date) -> bool:
        return self.status in self.AWAITING_PAYMENT_STATUSES and self.due_date < reference_date

    @override
    def clean(self) -> None:
        BillingDocumentRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.unit} - {self.reference_month:%Y-%m}"
