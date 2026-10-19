from typing import TYPE_CHECKING, final, override

from django.db import models
from django.db.models import F, Q

from apps.billing.errors import BillingPlanError
from apps.billing.models.querysets import BillingPlanQuerySet
from apps.billing.models.rules import BillingPlanRules
from apps.billing.validators import validate_first_day_of_month
from apps.condominiums.models import Condominium
from apps.core.models.base import BaseModel

if TYPE_CHECKING:
    from django.db.models.fields.related_descriptors import RelatedManager

    from .billing_plan_item import BillingPlanItem


@final
class BillingPlan(BaseModel):
    """The mold of a condominium's monthly charge (the PDF's *PlanoCobranca*): the items every unit pays.

    The issuance of a month joins the items of every plan in force into one boleto per unit.
    """

    if TYPE_CHECKING:
        items: "RelatedManager[BillingPlanItem]"

    condominium = models.ForeignKey(
        Condominium, on_delete=models.CASCADE, related_name="billing_plans"
    )
    name = models.CharField(max_length=120)
    active = models.BooleanField(default=True)
    start_month = models.DateField(null=True, blank=True, validators=[validate_first_day_of_month])
    end_month = models.DateField(null=True, blank=True, validators=[validate_first_day_of_month])

    company_lookup = "condominium__company"

    objects = BillingPlanQuerySet.as_manager()

    class Meta:
        verbose_name = "Billing Plan"
        verbose_name_plural = "Billing Plans"
        ordering = ("condominium__name", "name")
        constraints = (
            models.UniqueConstraint(
                fields=("condominium", "name"),
                name="billing_plan_unique_name_per_condominium",
                violation_error_message=BillingPlanError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                violation_error_code=BillingPlanError.NAME_DUPLICATE_IN_CONDOMINIUM.value,
            ),
            models.CheckConstraint(
                name="billing_plan_end_not_before_start",
                condition=Q(start_month__isnull=True)
                | Q(end_month__isnull=True)
                | Q(end_month__gte=F("start_month")),
                violation_error_message=BillingPlanError.END_MONTH_BEFORE_START_MONTH.message,
                violation_error_code=BillingPlanError.END_MONTH_BEFORE_START_MONTH.value,
            ),
        )

    @override
    def clean(self) -> None:
        BillingPlanRules(self).validate()

    @override
    def __str__(self) -> str:
        return f"{self.condominium} - {self.name}"
