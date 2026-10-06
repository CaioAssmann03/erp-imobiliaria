import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from typing_extensions import override


class CurrentAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    entity_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    entity_id = models.UUIDField(editable=False)
    entity = GenericForeignKey("entity_type", "entity_id")

    balance = models.DecimalField(max_digits=12, decimal_places=2, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Current Account"
        verbose_name_plural = "Current Accounts"
        constraints = models.UniqueConstraint(
            fields=("entity_type", "entity_id"),
            name="current_account_unique_account_per_owner",
            violation_error_message="This account has already an owner",
        )

    @override
    def __str__(self) -> str:
        return f"{self.entity} - {self.balance}"
