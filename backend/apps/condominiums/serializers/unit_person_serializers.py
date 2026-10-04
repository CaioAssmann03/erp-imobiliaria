from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from apps.persons.serializers import PersonSerializer

from ..models import UnitPerson


class UnitPersonSerializer(serializers.ModelSerializer[UnitPerson]):
    person_detail = PersonSerializer(source="person", read_only=True)

    @final
    class Meta:
        model = UnitPerson
        fields = (
            "id",
            "unit",
            "person",
            "person_detail",
            "role",
            "ownership_percentage",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        data = {**getattr(self.instance, "__dict__", {}), **attrs}
        role = data.get("role")
        percentage = data.get("ownership_percentage")
        if role == "owner" and (percentage is None or not 0 <= percentage <= 100):
            raise serializers.ValidationError(
                {"ownership_percentage": "Owner needs a percentage between 0 and 100."}
            )
        if role == "tenant" and percentage is not None:
            raise serializers.ValidationError(
                {"ownership_percentage": "Tenant cannot have an ownership percentage."}
            )
        start, end = data.get("start_date"), data.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "End date cannot be before start date."}
            )
        return attrs
