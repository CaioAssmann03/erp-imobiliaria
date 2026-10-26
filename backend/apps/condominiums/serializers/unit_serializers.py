from typing import Any, final, override

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin, to_drf_errors

from ..errors import UnitFractionError
from ..models import Unit
from ..services.create_unit import create_unit
from ..services.update_unit import update_unit
from .unit_fraction_serializers import UnitFractionSerializer
from .unit_person_serializers import UnitPersonSerializer


class UnitSerializer(ModelRulesMixin, serializers.ModelSerializer[Unit]):
    unit_people = UnitPersonSerializer(many=True, read_only=True)
    fractions = UnitFractionSerializer(many=True, required=False)

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
            "is_manager_unit",
            "billing_recipient",
            "registration_number",
            "gas_value",
            "water_value",
            "electricity_value",
            "active",
            "is_billing_blocked",
            "fractions",
            "unit_people",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_fractions(self, fractions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        criterion_ids = [fraction["criterion"].pk for fraction in fractions]
        if len(criterion_ids) != len(set(criterion_ids)):
            raise serializers.ValidationError(
                UnitFractionError.CRITERION_DUPLICATE.message, code=UnitFractionError.CRITERION_DUPLICATE.value
            )
        return fractions

    @override
    def create(self, validated_data: dict[str, Any]) -> Unit:
        try:
            return create_unit(validated_data)
        except DjangoValidationError as error:
            raise _fractions_error(error) from error

    @override
    def update(self, instance: Unit, validated_data: dict[str, Any]) -> Unit:
        try:
            return update_unit(instance, validated_data)
        except DjangoValidationError as error:
            raise _fractions_error(error) from error


def _fractions_error(error: DjangoValidationError) -> serializers.ValidationError:
    """What a fraction row's rules refused, reported on `fractions` (the field the client sent) with each rule's code."""
    details = to_drf_errors(error)
    return serializers.ValidationError({"fractions": [detail for problems in details.values() for detail in problems]})
