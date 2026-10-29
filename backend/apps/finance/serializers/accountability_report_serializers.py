from typing import Any

from rest_framework import serializers

from apps.core.infrastructure.validators import validate_first_day_of_month

from ..models import CurrentAccountEntry


class AccountabilityQuerySerializer(serializers.Serializer[Any]):
    """The report's query: a condominium and a month (the first day of a month)."""

    condominium = serializers.UUIDField()
    month = serializers.DateField(validators=[validate_first_day_of_month])


class AccountabilityEntrySerializer(serializers.Serializer[Any]):
    id = serializers.UUIDField()
    entry_date = serializers.DateField()
    kind = serializers.ChoiceField(choices=CurrentAccountEntry.Kind.choices)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    description = serializers.CharField()
    cost_center_name = serializers.CharField()
    entry_template_name = serializers.CharField()
    unit_name = serializers.CharField(allow_null=True)


class AccountabilityCostCenterSerializer(serializers.Serializer[Any]):
    cost_center_id = serializers.UUIDField()
    cost_center_code = serializers.IntegerField()
    cost_center_name = serializers.CharField()
    opening_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_credits = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_debits = serializers.DecimalField(max_digits=14, decimal_places=2)
    closing_balance = serializers.DecimalField(max_digits=14, decimal_places=2)


class AccountabilityReportSerializer(serializers.Serializer[Any]):
    """A condominium's month in its current account, in total and per sub-conta, with the entries (at most 2000)."""

    condominium_id = serializers.UUIDField()
    condominium_code = serializers.IntegerField()
    condominium_name = serializers.CharField()
    month = serializers.DateField()
    opening_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_credits = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_debits = serializers.DecimalField(max_digits=14, decimal_places=2)
    closing_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_cost_center = AccountabilityCostCenterSerializer(many=True)
    entries = AccountabilityEntrySerializer(many=True)
    truncated = serializers.BooleanField()
