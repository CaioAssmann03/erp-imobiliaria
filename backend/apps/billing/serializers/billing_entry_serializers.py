from datetime import date
from typing import Any, final, override

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin
from apps.core.serializers.model_rules import build_candidate, run_model_rules

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


class BillingEntryUnitAmountSerializer(serializers.Serializer[Any]):
    """What one unit pays for an entry in a month."""

    unit = serializers.UUIDField()
    unit_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class BillingEntryMonthSerializer(serializers.Serializer[Any]):
    """An entry as the boleto of one month carries it."""

    line_description = serializers.CharField()
    installment = serializers.CharField(help_text="`k/n` for an installment entry, empty otherwise.")
    unit_amounts = BillingEntryUnitAmountSerializer(many=True)


class BillingEntryPreviewSerializer(serializers.Serializer[Any]):
    """The per-unit values of an entry that is not saved yet."""

    reference_month = serializers.DateField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_amounts = BillingEntryUnitAmountSerializer(many=True)


class BillingEntrySerializer(ModelRulesMixin, serializers.ModelSerializer[BillingEntry]):
    """A launch with its units. Sending `units` replaces the whole selection. `?reference_month=` adds the month's values."""

    condominium_name = serializers.CharField(source="condominium.name", read_only=True)
    event_code = serializers.IntegerField(source="event.code", read_only=True, default=None)
    event_name = serializers.CharField(source="event.name", read_only=True, default=None)
    event_credits_company = serializers.BooleanField(source="event.credits_company", read_only=True, default=False)
    cost_center_code = serializers.IntegerField(source="cost_center.code", read_only=True, default=None)
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True, default=None)
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
            "event_credits_company",
            "description",
            "allocation",
            "ideal_fraction_number",
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

    @extend_schema_field(BillingEntryMonthSerializer(allow_null=True))
    def get_month(self, entry: BillingEntry) -> dict[str, Any] | None:
        """The entry's values in the requested reference month: the boleto line, the installment and each unit's amount."""
        reference_month = self.context.get("reference_month")
        if reference_month is None or not entry.covers(reference_month):
            return None
        links = [link for link in entry.entry_units.all() if link.unit.active]
        amounts = entry.amounts_by_unit(
            [link.unit for link in links],
            {link.unit_id: link.amount for link in links if link.amount is not None},
        )
        return {
            "line_description": entry.line_description(reference_month),
            "installment": entry.installment_label(reference_month),
            "unit_amounts": [
                {"unit": link.unit_id, "unit_name": link.unit.name, "amount": amounts[link.unit_id]} for link in links
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
        unit_errors: list[Any] = []
        for unit_values in attrs["entry_units"]:
            link_candidate = build_candidate(BillingEntryUnit, unit_values)
            link_candidate.entry = entry_candidate  # type: ignore[attr-defined]
            try:
                run_model_rules(link_candidate, excluded_fields=("entry",))
            except serializers.ValidationError as error:
                unit_errors.append(error.detail)
            else:
                unit_errors.append({})
        if any(unit_errors):
            raise serializers.ValidationError({"units": unit_errors})


class BillingEntryEndSerializer(serializers.Serializer[Any]):
    end_month = serializers.DateField()


def reference_month_of(value: Any) -> date:
    """The first day of the month in a `YYYY-MM-DD` query or body value."""
    parsed: date = serializers.DateField().run_validation(value)
    return parsed.replace(day=1)
