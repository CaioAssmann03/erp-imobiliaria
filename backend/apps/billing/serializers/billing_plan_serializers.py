from typing import Any, final, override

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin
from apps.core.serializers.model_rules import build_candidate, run_model_rules

from ..models import BillingPlan, BillingPlanItem
from ..services.create_billing_plan import create_billing_plan
from ..services.update_billing_plan import update_billing_plan


class BillingPlanItemSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingPlanItem]):
    """One item of a plan. `position` is the item's place in the list it was sent in."""

    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True)
    entry_template_name = serializers.CharField(source="entry_template.name", read_only=True)

    @final
    class Meta:
        model = BillingPlanItem
        fields = (
            "id",
            "position",
            "description",
            "cost_center",
            "cost_center_name",
            "entry_template",
            "entry_template_name",
            "calculation_kind",
            "amount",
            "apportionment_criterion",
            "unit_value_field",
        )
        read_only_fields = ("id", "position")


class BillingPlanSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingPlan]):
    """A billing plan of a condominium with its items. Sending `items` replaces the whole list, in that order."""

    condominium_name = serializers.CharField(source="condominium.name", read_only=True)
    items = BillingPlanItemSerializer(many=True, allow_empty=False)

    @final
    class Meta:
        model = BillingPlan
        fields = (
            "id",
            "condominium",
            "condominium_name",
            "name",
            "active",
            "start_month",
            "end_month",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        if "items" in attrs:
            self._run_item_rules_with_the_plan(attrs)
        return attrs

    @override
    def create(self, validated_data: dict[str, Any]) -> BillingPlan:
        return create_billing_plan(validated_data)

    @override
    def update(self, instance: BillingPlan, validated_data: dict[str, Any]) -> BillingPlan:
        return update_billing_plan(instance, validated_data)

    def _run_item_rules_with_the_plan(self, attrs: dict[str, Any]) -> None:
        """The item rules that need the plan (its condominium) could not run in the nested serializer."""
        existing_plan = self.instance if isinstance(self.instance, BillingPlan) else None
        plan_candidate = build_candidate(BillingPlan, attrs, existing_plan)
        item_errors: list[Any] = []
        for item_values in attrs["items"]:
            item_candidate = build_candidate(BillingPlanItem, item_values)
            item_candidate.plan = plan_candidate  # type: ignore[attr-defined]
            try:
                run_model_rules(item_candidate, excluded_fields=("plan",))
            except serializers.ValidationError as error:
                item_errors.append(error.detail)
            else:
                item_errors.append({})
        if any(item_errors):
            raise serializers.ValidationError({"items": item_errors})
