from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import (
    Address,
)


class AddressSerializer(ModelRulesMixin, serializers.ModelSerializer[Address]):
    @final
    class Meta:
        model = Address
        fields = (
            "id",
            "zip_code",
            "street",
            "number",
            "complement",
            "district",
            "city",
            "state",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
