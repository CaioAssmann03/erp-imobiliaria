from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from ..models import Unit
from .unit_person_serializers import UnitPersonSerializer


class UnitSerializer(serializers.ModelSerializer[Unit]):
    unit_people = UnitPersonSerializer(many=True, read_only=True)

    @final
    class Meta:
        model = Unit
        fields = (
            "id",
            "condominium",
            "block",
            "name",
            "type",
            "resident_count",
            "ideal_fraction",
            "is_manager_unit",
            "registration_number",
            "gas_value",
            "water_value",
            "electricity_value",
            "active",
            "is_billing_blocked",
            "unit_people",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        block = attrs.get("block")
        condominium = attrs.get("condominium")
        if (
            block is not None
            and condominium is not None
            and block.condominium_id != condominium.id
        ):
            raise serializers.ValidationError(
                {"block": "Block belongs to another condominium"}
            )
        fraction = attrs.get("ideal_fraction")
        if fraction is not None and not 0 < fraction <= 1:
            raise serializers.ValidationError(
                {
                    "ideal_fraction": "Ideal fraction must be greater than 0 and at most 1."
                }
            )
        return attrs
