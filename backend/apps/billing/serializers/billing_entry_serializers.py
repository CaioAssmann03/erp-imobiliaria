from datetime import date
from typing import Any, final, override

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin
from apps.core.serializers.model_rules import build_candidate, to_drf_errors

from ..models import BillingEntry, BillingEntryUnit
from ..services.create_billing_entry import create_billing_entry
from ..services.update_billing_entry import update_billing_entry


class BillingEntryUnitSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingEntryUnit]):
    """A unit the entry selects; `amount` is that unit's own value (individual entries only)."""

    unit_name = serializers.CharField(source="unit.name", read_only=True)

    @final
    class Meta:
        model = BillingEntryUnit
        fields = ("id", "unit", "unit_name", "amount")
        read_only_fields = ("id",)
        validators = ()


class BillingEntrySerializer(ModelRulesMixin, serializers.ModelSerializer[BillingEntry]):
    """A launch with its units. Sending `units` replaces the whole selection. `?reference_month=` adds the month's values."""

    condominium_name = serializers.CharField(source="condominium.name", read_only=True)
    event_code = serializers.IntegerField(source="event.code", read_only=True, default=None)
    event_name = serializers.CharField(source="event.name", read_only=True, default=None)
    apportionment_criterion_name = serializers.CharField(
        source="apportionment_criterion.name", read_only=True, default=None
    )
    cost_center_code = serializers.IntegerField(source="cost_center.code", read_only=True)
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True)
    is_used = serializers.SerializerMethodField()
    month = serializers.SerializerMethodField()
    units = BillingEntryUnitSerializer(source="entry_units", many=True, allow_empty=False)

    @final
    class Meta:
        model = BillingEntry
        fields = (
            "id",
            "condominium",
            "condominium_name",
            "event",
            "event_code",
            "event_name",
            "description",
            "allocation",
            "apportionment_criterion",
            "apportionment_criterion_name",
            "recurrence",
            "installments_total",
            "start_month",
            "end_month",
            "cost_center",
            "cost_center_code",
            "cost_center_name",
            "entry_template",
            "amount",
            "units",
            "is_used",
            "month",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "entry_template", "created_at", "updated_at")

    def get_is_used(self, entry: BillingEntry) -> bool:
        return entry.is_used()

    def get_month(self, entry: BillingEntry) -> dict[str, Any] | None:
        """The entry's values in the requested reference month: the boleto line, the installment and each unit's amount."""
        reference_month = self.context.get("reference_month")
        if reference_month is None or not entry.covers(reference_month):
            return None
        amounts = entry.amounts_for_selected_units()
        return {
            "line_description": entry.line_description(reference_month),
            "installment": entry.installment_label(reference_month),
            "unit_amounts": [
                {"unit": link.unit_id, "unit_name": link.unit.name, "amount": amounts[link.unit_id]}
                for link in entry.entry_units.all()
                if link.unit.active
            ],
        }

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        if "entry_units" in attrs:
            self._run_unit_rules_with_the_entry(attrs)
        return attrs

    @override
    def create(self, validated_data: dict[str, Any]) -> BillingEntry:
        return create_billing_entry(self._service_data(validated_data))

    @override
    def update(self, instance: BillingEntry, validated_data: dict[str, Any]) -> BillingEntry:
        return update_billing_entry(instance, self._service_data(validated_data))

    @staticmethod
    def _service_data(validated_data: dict[str, Any]) -> dict[str, Any]:
        data = dict(validated_data)
        if "entry_units" in data:
            data["units"] = data.pop("entry_units")
        return data

    def _run_unit_rules_with_the_entry(self, attrs: dict[str, Any]) -> None:
        """The unit rules that need the entry (its condominium, its allocation) could not run in the nested serializer."""
        existing_entry = self.instance if isinstance(self.instance, BillingEntry) else None
        entry_candidate = build_candidate(BillingEntry, attrs, existing_entry)
        assert isinstance(entry_candidate, BillingEntry)
        unit_errors = [
            {} if error is None else to_drf_errors(error)
            for error in entry_candidate.collect_unit_errors(attrs["entry_units"])
        ]
        if any(unit_errors):
            raise serializers.ValidationError({"units": unit_errors})


class BillingEntryEndSerializer(serializers.Serializer[Any]):
    end_month = serializers.DateField()


def reference_month_of(value: Any) -> date:
    """The first day of the month in a `YYYY-MM-DD` query or body value."""
    parsed: date = serializers.DateField().run_validation(value)
    return parsed.replace(day=1)
