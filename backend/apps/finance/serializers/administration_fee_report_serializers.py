from typing import Any

from rest_framework import serializers

from apps.condominiums.models import CondominiumAdministrationContract
from apps.core.infrastructure.validators import validate_first_day_of_month

Contract = CondominiumAdministrationContract


class AdministrationFeeQuerySerializer(serializers.Serializer[Any]):
    """The report's query: a month (the first day of a month) and, optionally, one condominium."""

    month = serializers.DateField(validators=[validate_first_day_of_month])
    condominium = serializers.UUIDField(required=False)


class AdministrationFeeRowSerializer(serializers.Serializer[Any]):
    condominium_id = serializers.UUIDField()
    condominium_code = serializers.IntegerField()
    condominium_name = serializers.CharField()
    status = serializers.ChoiceField(choices=("due", "not_started", "no_contract"))
    fee_type = serializers.ChoiceField(choices=Contract.FeeType.choices, allow_null=True)
    fee_basis = serializers.ChoiceField(choices=Contract.FeeBasis.choices, allow_null=True)
    fee_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    fee_amount = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    fee_floor = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    fee_ceiling = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    base_amount = serializers.DecimalField(max_digits=14, decimal_places=2, allow_null=True)
    fee_before_limits = serializers.DecimalField(max_digits=14, decimal_places=2)
    fee_due = serializers.DecimalField(max_digits=14, decimal_places=2)
    charges_iss_on_fee = serializers.BooleanField()


class AdministrationFeeReportSerializer(serializers.Serializer[Any]):
    """What the administradora has to charge each active condominium in a month; only `due` rows are counted and totalled."""

    month = serializers.DateField()
    count = serializers.IntegerField()
    total_fee = serializers.DecimalField(max_digits=14, decimal_places=2)
    rows = AdministrationFeeRowSerializer(many=True)
