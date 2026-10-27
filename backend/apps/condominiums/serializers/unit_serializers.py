from typing import Any, final, override

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin, to_drf_errors

from ..models import Unit, UnitApportionmentFraction
from ..services.create_unit import create_unit
from ..services.update_unit import update_unit
from .unit_apportionment_fraction_serializers import UnitApportionmentFractionSerializer
from .unit_person_serializers import UnitPersonSerializer


class UnitSerializer(ModelRulesMixin, serializers.ModelSerializer[Unit]):
    unit_people = UnitPersonSerializer(many=True, read_only=True)
    fractions = UnitApportionmentFractionSerializer(many=True, required=False)

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

    def validate_fractions(
        self, fractions: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        try:
            UnitApportionmentFraction.validate_distinct_criteria(
                fraction["criterion"].pk for fraction in fractions
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError(_error_details(error)) from error
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


def _error_details(error: DjangoValidationError) -> list[Any]:
    """What the model refused, as one list of DRF details that keep each rule's code."""
    return [detail for problems in to_drf_errors(error).values() for detail in problems]


def _fractions_error(error: DjangoValidationError) -> serializers.ValidationError:
    """What a fraction row's rules refused, reported on `fractions` (the field the client sent)."""
    return serializers.ValidationError({"fractions": _error_details(error)})
