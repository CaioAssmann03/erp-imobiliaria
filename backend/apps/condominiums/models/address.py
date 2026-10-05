import uuid

from django.db import models
from typing_extensions import final, override


@final
class Address(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    zip_code = models.CharField(max_length=8, blank=True, null=True)
    street = models.CharField(max_length=255, blank=True, null=True)
    number = models.CharField(max_length=10, blank=True, null=True)
    complement = models.CharField(max_length=60, blank=True, null=True)
    district = models.CharField(max_length=120, blank=True, null=True)
    city = models.CharField(max_length=120, blank=True, null=True)
    state = models.CharField(max_length=2, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"

    @override
    def __str__(self) -> str:
        return ", ".join(part for part in (self.street, self.number, self.city) if part)
