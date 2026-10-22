from typing import final, override

from django.db import models

from apps.condominiums.models import Condominium
from apps.core.fields.encrypted_text import EncryptedTextField
from apps.core.models.base import BaseModel


@final
class GatewayAccount(BaseModel):
    """The gateway (Asaas) sub-account of a condominium: the beneficiary of its boletos (spec 030).

    The API key and the webhook token are shown by the gateway only once; they are stored encrypted and
    must never reach the API, the Admin, logs or error messages.
    """

    class Status(models.TextChoices):
        PENDING = ("pending", "Pending")
        ACTIVE = ("active", "Active")
        BLOCKED = ("blocked", "Blocked")

    condominium = models.OneToOneField(Condominium, on_delete=models.PROTECT, related_name="gateway_account")
    gateway_account_id = models.CharField(max_length=64, unique=True)
    wallet_id = models.CharField(max_length=64)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    api_key = EncryptedTextField()
    webhook_token = EncryptedTextField()
    approved_at = models.DateTimeField(null=True, blank=True)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Gateway Account"
        verbose_name_plural = "Gateway Accounts"
        ordering = ("condominium__name",)

    def can_register_charges(self) -> bool:
        return self.status == self.Status.ACTIVE

    @override
    def __str__(self) -> str:
        return f"{self.condominium} ({self.status})"
