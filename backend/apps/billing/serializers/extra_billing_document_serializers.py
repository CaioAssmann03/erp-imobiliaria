from typing import Any, final

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail

from apps.condominiums.models import Condominium, CondominiumApportionmentCriterion, Unit
from apps.core.infrastructure.scoping import CompanyScopedPrimaryKeyRelatedField
from apps.core.serializers.model_rules import to_drf_errors
from apps.finance.models import CostCenter

from ..errors import BillingDocumentError
from ..models import BillingEntry, BillingEvent, BillingRun, CondominiumBillingRules
from .billing_document_serializers import BillingDocumentSerializer


def _detail(error: BillingDocumentError) -> ErrorDetail:
    return ErrorDetail(error.message, code=error.value)


class ExtraBillingLineSerializer(serializers.Serializer[Any]):
    """A line of the extra boleto, written like a launch of *Inclusão de valores* (the launch's own rules validate it)."""

    event = CompanyScopedPrimaryKeyRelatedField(queryset=BillingEvent.objects.all(), allow_null=True, required=False)
    description = serializers.CharField(max_length=120, allow_blank=True, required=False, default="")
    allocation = serializers.ChoiceField(choices=BillingEntry.Allocation.choices)
    apportionment_criterion = CompanyScopedPrimaryKeyRelatedField(
        queryset=CondominiumApportionmentCriterion.objects.all(), allow_null=True, required=False
    )
    cost_center = CompanyScopedPrimaryKeyRelatedField(queryset=CostCenter.objects.all(), allow_null=True, required=False)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)


class ExtraBillingDocumentSerializer(serializers.Serializer[Any]):
    """Request of `POST /billing-documents/extra/`. `validate` leaves the lines as unsaved launches, already validated."""

    condominium = CompanyScopedPrimaryKeyRelatedField(queryset=Condominium.objects.all())
    due_date = serializers.DateField()
    competence_month = serializers.DateField()
    units = CompanyScopedPrimaryKeyRelatedField(queryset=Unit.objects.all(), many=True, allow_empty=False)
    lines = ExtraBillingLineSerializer(many=True, allow_empty=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        condominium: Condominium = attrs["condominium"]
        if not CondominiumBillingRules.objects.filter(condominium=condominium).exists():
            raise serializers.ValidationError(
                {"condominium": [_detail(BillingDocumentError.EXTRA_CONDOMINIUM_WITHOUT_BILLING_RULES)]}
            )
        units: list[Unit] = sorted(set(attrs["units"]), key=lambda unit: (unit.name, str(unit.pk)))
        if any(unit.condominium_id != condominium.pk for unit in units):
            raise serializers.ValidationError({"units": [_detail(BillingDocumentError.EXTRA_UNIT_OTHER_CONDOMINIUM)]})
        entries = [self._line_as_entry(condominium, attrs["competence_month"], line) for line in attrs["lines"]]
        line_errors = [self._line_errors(entry) for entry in entries]
        if any(line_errors):
            raise serializers.ValidationError({"lines": line_errors})
        return {**attrs, "units": units, "lines": entries}

    @staticmethod
    def _line_as_entry(condominium: Condominium, competence_month: Any, line: dict[str, Any]) -> BillingEntry:
        return BillingEntry(
            condominium=condominium,
            event=line.get("event"),
            description=line.get("description", ""),
            allocation=line["allocation"],
            apportionment_criterion=line.get("apportionment_criterion"),
            recurrence=BillingEntry.Recurrence.ONCE,
            start_month=competence_month,
            cost_center=line.get("cost_center"),
            amount=line["amount"],
        )

    @staticmethod
    def _line_errors(entry: BillingEntry) -> dict[str, Any]:
        try:
            entry.full_clean()
        except DjangoValidationError as error:
            return to_drf_errors(error)
        return {}


class SkippedUnitSerializer(serializers.Serializer[Any]):
    """A selected unit that was not issued, and why."""

    unit = serializers.UUIDField(source="unit.pk")
    unit_name = serializers.CharField(source="unit.name")
    code = serializers.ChoiceField(choices=BillingRun.ProblemCode.choices)


class ExtraBillingResultSerializer(serializers.Serializer[Any]):
    issued = BillingDocumentSerializer(many=True)
    skipped = SkippedUnitSerializer(many=True)


__all__ = ["ExtraBillingDocumentSerializer", "ExtraBillingResultSerializer", "ExtraBillingLineSerializer", "SkippedUnitSerializer"]
