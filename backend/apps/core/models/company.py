import uuid

from django.db import models
from typing_extensions import final, override

from apps.core.validators.cnpj import validate_cnpj


@final
class Company(models.Model):
    """Administradora (multiempresa desde o início)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    legal_name = models.CharField(max_length=255)
    trade_name = models.CharField(max_length=255, blank=True)
    cnpj = models.CharField(max_length=14, unique=True, validators=[validate_cnpj])
    logo_url = models.URLField(blank=True)

    zip_code = models.CharField(max_length=8, blank=True)
    street = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=120, blank=True)
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=2, blank=True)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        ordering = ("legal_name",)

    @override
    def __str__(self) -> str:
        return self.trade_name or self.legal_name
