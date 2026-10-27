from typing import Any, final

from rest_framework import serializers

from ..models import CompanyEntry


class CompanyEntrySerializer(serializers.ModelSerializer[CompanyEntry]):
    """A credit of the administradora (the registration fee), with where it came from."""

    condominium_name = serializers.CharField(source="billing_document_item.document.unit.condominium.name", read_only=True)
    unit_name = serializers.CharField(source="billing_document_item.document.unit.name", read_only=True)
    reference_month = serializers.DateField(source="billing_document_item.document.reference_month", read_only=True)

    @final
    class Meta:
        model = CompanyEntry
        fields = (
            "id",
            "entry_date",
            "amount",
            "description",
            "condominium_name",
            "unit_name",
            "reference_month",
            "created_at",
        )
        read_only_fields = fields


class CompanyBalanceSerializer(serializers.Serializer[Any]):
    balance = serializers.DecimalField(max_digits=14, decimal_places=2)
