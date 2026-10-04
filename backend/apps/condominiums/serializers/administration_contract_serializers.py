from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from ..models import AdministrationContract


class AdministrationContractSerializer(serializers.ModelSerializer[AdministrationContract]):
    @final
    class Meta:
        model = AdministrationContract
        exclude = ("condominium",)
        read_only_fields = ("id",)

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        data = {**getattr(self.instance, "__dict__", {}), **attrs}
        fee_type = data.get("fee_type", "fixed")
        if fee_type == "fixed" and data.get("fee_amount") is None:
            raise serializers.ValidationError({"fee_amount": "Fixed fee requires an amount."})
        if fee_type == "variable" and (
            data.get("fee_percentage") is None or not data.get("fee_basis")
        ):
            raise serializers.ValidationError(
                "Variable fee requires percentage and basis."
            )
        floor, ceiling = data.get("fee_floor"), data.get("fee_ceiling")
        if floor is not None and ceiling is not None and floor > ceiling:
            raise serializers.ValidationError({"fee_floor": "Floor cannot exceed ceiling."})
        return attrs
