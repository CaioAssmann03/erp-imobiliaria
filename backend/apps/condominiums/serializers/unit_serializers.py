from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import Unit
from .unit_person_serializers import UnitPersonSerializer


class UnitSerializer(ModelRulesMixin, serializers.ModelSerializer[Unit]):
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
