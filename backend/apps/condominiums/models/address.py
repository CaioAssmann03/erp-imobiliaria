from typing import final, override

from django.db import models

from apps.core.models.base import BaseModel


@final
class Address(BaseModel):

    zip_code = models.CharField(max_length=8, blank=True, null=True)
    street = models.CharField(max_length=255, blank=True, null=True)
    number = models.CharField(max_length=10, blank=True, null=True)
    complement = models.CharField(max_length=60, blank=True, null=True)
    district = models.CharField(max_length=120, blank=True, null=True)
    city = models.CharField(max_length=120, blank=True, null=True)
    state = models.CharField(max_length=2, blank=True, null=True)

    company_lookup = "condominium__company"

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"

    @override
    def __str__(self) -> str:
        return ", ".join(part for part in (self.street, self.number, self.city) if part)
