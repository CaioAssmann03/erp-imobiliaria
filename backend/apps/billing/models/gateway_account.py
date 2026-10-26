from typing import final, override

from django.db import models

from apps.core.fields.encrypted_text import EncryptedTextField
from apps.core.models import Company
from apps.core.models.base import BaseModel


@final
class GatewayAccount(BaseModel):
    """The gateway (Asaas) account of a company: it issues the boletos of every condominium and receives the money (spec 037).

    The API key and the webhook token are stored encrypted and must never reach the API, the Admin, logs or error messages.
    """

    class Status(models.TextChoices):
        PENDING = ("pending", "Pending")
        ACTIVE = ("active", "Active")
        BLOCKED = ("blocked", "Blocked")

    company = models.OneToOneField(Company, on_delete=models.PROTECT, related_name="gateway_account")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    api_key = EncryptedTextField()
    webhook_token = EncryptedTextField()

    company_lookup = "company"

    class Meta:
        verbose_name = "Gateway Account"
        verbose_name_plural = "Gateway Accounts"
        ordering = ("company__legal_name",)

    def can_register_charges(self) -> bool:
        return self.status == self.Status.ACTIVE

    @override
    def __str__(self) -> str:
        return f"{self.company} ({self.status})"
