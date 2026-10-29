from typing import Any

from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail

from apps.billing.models import BillingDocument
from apps.condominiums.models import Unit, UnitPerson
from apps.core.infrastructure.dates import add_months
from apps.core.infrastructure.validators import validate_first_day_of_month

from ..models import CurrentAccountEntry

MAX_PERIOD_MONTHS = 36
PERIOD_BEFORE_START = "unit_sheet.period.before_start"
PERIOD_TOO_LONG = "unit_sheet.period.too_long"


def _money() -> serializers.DecimalField:
    return serializers.DecimalField(max_digits=14, decimal_places=2)


class UnitSheetQuerySerializer(serializers.Serializer[Any]):
    """The sheet's query: a unit and, optionally, the first and last month of the period (first days of months)."""

    unit = serializers.UUIDField()
    from_month = serializers.DateField(required=False, validators=[validate_first_day_of_month])
    to_month = serializers.DateField(required=False, validators=[validate_first_day_of_month])

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """Fill the missing end of the period (the month of today, and 11 months before the last one) and check it."""
        to_month = attrs.get("to_month") or timezone.localdate().replace(day=1)
        from_month = attrs.get("from_month") or add_months(to_month, -11)
        if to_month < from_month:
            raise serializers.ValidationError({"to_month": [ErrorDetail("The last month cannot be before the first.", code=PERIOD_BEFORE_START)]})
        if add_months(from_month, MAX_PERIOD_MONTHS) <= to_month:
            raise serializers.ValidationError({"to_month": [ErrorDetail(f"The period is at most {MAX_PERIOD_MONTHS} months.", code=PERIOD_TOO_LONG)]})
        return {**attrs, "from_month": from_month, "to_month": to_month}


class UnitSheetFractionSerializer(serializers.Serializer[Any]):
    criterion_name = serializers.CharField()
    value = serializers.DecimalField(max_digits=9, decimal_places=8)


class UnitSheetPersonSerializer(serializers.Serializer[Any]):
    role = serializers.ChoiceField(choices=UnitPerson.Role.choices)
    name = serializers.CharField()
    ownership_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    start_date = serializers.DateField()
    end_date = serializers.DateField(allow_null=True)


class UnitSheetBoletoSerializer(serializers.Serializer[Any]):
    id = serializers.UUIDField()
    reference_month = serializers.DateField()
    kind = serializers.ChoiceField(choices=BillingDocument.Kind.choices)
    due_date = serializers.DateField()
    amount = _money()
    status = serializers.ChoiceField(choices=BillingDocument.Status.choices)
    is_overdue = serializers.BooleanField()
    days_overdue = serializers.IntegerField()
    paid_on = serializers.DateField(allow_null=True)


class UnitSheetEntrySerializer(serializers.Serializer[Any]):
    id = serializers.UUIDField()
    entry_date = serializers.DateField()
    kind = serializers.ChoiceField(choices=CurrentAccountEntry.Kind.choices)
    amount = _money()
    description = serializers.CharField()
    cost_center_name = serializers.CharField()


class UnitSheetSerializer(serializers.Serializer[Any]):
    """One page about a unit: data, people, boletos with their totals and the entries of its account (at most 2000 each)."""

    unit_id = serializers.UUIDField()
    unit_name = serializers.CharField()
    block_name = serializers.CharField(allow_null=True)
    condominium_id = serializers.UUIDField()
    condominium_code = serializers.IntegerField()
    condominium_name = serializers.CharField()
    unit_type = serializers.ChoiceField(choices=Unit.UnitType.choices)
    is_active = serializers.BooleanField()
    is_manager_unit = serializers.BooleanField()
    is_billing_blocked = serializers.BooleanField()
    registration_number = serializers.CharField()
    resident_count = serializers.IntegerField()
    gas_value = _money()
    water_value = _money()
    electricity_value = _money()
    from_month = serializers.DateField()
    to_month = serializers.DateField()
    fractions = UnitSheetFractionSerializer(many=True)
    people = UnitSheetPersonSerializer(many=True)
    boletos = UnitSheetBoletoSerializer(many=True)
    total_issued = _money()
    total_paid = _money()
    total_open = _money()
    total_overdue = _money()
    boletos_truncated = serializers.BooleanField()
    entries = UnitSheetEntrySerializer(many=True)
    total_credits = _money()
    total_debits = _money()
    entries_truncated = serializers.BooleanField()
