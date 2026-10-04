from rest_framework import serializers
from typing_extensions import final

from ..models import (
    Address,
)


class AddressSerializer(serializers.ModelSerializer):
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
