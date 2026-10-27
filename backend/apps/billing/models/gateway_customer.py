from typing import final, override

from django.db import models

from apps.billing.errors import GatewayCustomerError
from apps.billing.models.gateway_account import GatewayAccount
from apps.core.models.base import BaseModel
from apps.persons.models import Person


@final
class GatewayCustomer(BaseModel):
    """A person as a customer of a condominium's gateway account: created once and reused (spec 031).

    The gateway allows duplicate customers, so this record is what keeps one per (person, account).
    """

    person = models.ForeignKey(Person, on_delete=models.PROTECT, related_name="gateway_customers")
    gateway_account = models.ForeignKey(GatewayAccount, on_delete=models.PROTECT, related_name="customers")
    gateway_customer_id = models.CharField(max_length=64)

    company_lookup = "gateway_account__company"

    class Meta:
        verbose_name = "Gateway Customer"
        verbose_name_plural = "Gateway Customers"
        constraints = (
            models.UniqueConstraint(
                fields=("person", "gateway_account"),
                name="gateway_customer_unique_per_account",
                violation_error_message=GatewayCustomerError.DUPLICATE_FOR_ACCOUNT.message,
                violation_error_code=GatewayCustomerError.DUPLICATE_FOR_ACCOUNT.value,
            ),
        )

    @override
    def __str__(self) -> str:
        return f"{self.person} @ {self.gateway_account}"
