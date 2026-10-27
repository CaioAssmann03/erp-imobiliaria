from typing import Any, final, override

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import BillingRun
from ..services.issue_condominium_billing import issue_condominium_billing


class BillingRunProblemSerializer(serializers.Serializer[dict[str, Any]]):
    """Why a unit was skipped or failed, or (no unit) why the whole condominium could not be issued."""

    unit = serializers.UUIDField(allow_null=True, read_only=True)
    unit_name = serializers.CharField(allow_null=True, read_only=True)
    code = serializers.ChoiceField(choices=BillingRun.ProblemCode.choices, read_only=True)


class BillingRunSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingRun]):
    """An execution of the monthly issuance. Creating one issues the condominium's month now and answers its result."""

    condominium_name = serializers.CharField(source="condominium.name", read_only=True)
    problems = serializers.SerializerMethodField()

    @final
    class Meta:
        model = BillingRun
        fields = (
            "id",
            "condominium",
            "condominium_name",
            "reference_month",
            "status",
            "issued_count",
            "already_issued_count",
            "skipped_count",
            "failed_count",
            "started_at",
            "finished_at",
            "problems",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "issued_count",
            "already_issued_count",
            "skipped_count",
            "failed_count",
            "started_at",
            "finished_at",
            "problems",
            "created_at",
            "updated_at",
        )

    @extend_schema_field(BillingRunProblemSerializer(many=True))
    def get_problems(self, run: BillingRun) -> list[dict[str, Any]]:
        return run.problems_with_unit_names()

    @override
    def create(self, validated_data: dict[str, Any]) -> BillingRun:
        return issue_condominium_billing(validated_data["condominium"], validated_data["reference_month"])
