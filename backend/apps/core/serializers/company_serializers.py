from rest_framework import serializers
from typing_extensions import final

from ..models import Company


class CompanySerializer(serializers.ModelSerializer[Company]):
    @final
    class Meta:
        model = Company
        fields = (
            "id",
            "legal_name",
            "trade_name",
            "cnpj",
            "logo_url",
            "zip_code",
            "street",
            "district",
            "city",
            "state",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
