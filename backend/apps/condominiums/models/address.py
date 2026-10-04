import uuid

from django.contrib.postgres.indexes import GinIndex, OpClass
from django.db import models
from django.db.models.functions import Upper
from typing_extensions import override


class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    zip_code = models.CharField(max_length=9, blank=True, null=True)
    street = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=120, blank=True, null=True)
    city = models.CharField(max_length=120, blank=True, null=True)
    state = models.CharField(max_length=2, blank=True, null=True)

    number = models.CharField(max_length=5, blank=True, null=True)
    complement = models.CharField(max_length=4, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"
        indexes = GinIndex(
            OpClass(Upper("street"), name="gin_trim_ops"), name="address_name_trgm"
        )

    @override
    def __str__(self) -> str:
        return self.street
