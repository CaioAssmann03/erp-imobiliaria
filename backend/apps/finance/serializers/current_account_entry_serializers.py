from typing import Any, final, override

from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import CurrentAccountEntry, EntryBatch
from ..services.post_entries import post_entries
from ..services.post_entry import post_entry


class CurrentAccountEntrySerializer(ModelRulesMixin, serializers.ModelSerializer[CurrentAccountEntry]):
    """A line of the statement; only a manual entry is written here (the others come from services)."""

    condominium = serializers.UUIDField(source="current_account.condominium_id", read_only=True)
    condominium_name = serializers.CharField(source="current_account.condominium.name", read_only=True)
    entry_template_name = serializers.CharField(source="entry_template.name", read_only=True)
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True)
    unit_name = serializers.CharField(source="unit.name", read_only=True, default=None)
    batch_origin = serializers.CharField(source="batch.origin", read_only=True)
    batch_date = serializers.DateField(source="batch.batch_date", read_only=True)
    is_reversed = serializers.SerializerMethodField()

    @final
    class Meta:
        model = CurrentAccountEntry
        fields = (
            "id",
            "company",
            "registry",
            "current_account",
            "condominium",
            "condominium_name",
            "batch",
            "batch_origin",
            "batch_date",
            "entry_template",
            "entry_template_name",
            "cost_center",
            "cost_center_name",
            "unit",
            "unit_name",
            "entry_date",
            "competence_month",
            "kind",
            "amount",
            "description",
            "justification",
            "origin",
            "account_payable",
            "billing_document_item",
            "reversal_of",
            "is_reversed",
            "created_by",
            "created_at",
        )
        read_only_fields = (
            "id",
            "company",
            "registry",
            "origin",
            "account_payable",
            "billing_document_item",
            "reversal_of",
            "created_by",
            "created_at",
        )

    def get_is_reversed(self, entry: CurrentAccountEntry) -> bool:
        return hasattr(entry, "reversal")

    @override
    def create(self, validated_data: dict[str, Any]) -> CurrentAccountEntry:
        user = self.context["request"].user
        entry = CurrentAccountEntry(company=request_company(self), created_by=user, **validated_data)
        return post_entry(entry)


class ReverseEntrySerializer(serializers.Serializer[dict[str, Any]]):
    """Why and when an entry is reversed."""

    reason = serializers.CharField()
    reversal_date = serializers.DateField()


class BatchEntryLineSerializer(CurrentAccountEntrySerializer):
    """One line of a batch: the same manual entry, its batch coming from the URL (`context["batch"]`)."""

    @final
    class Meta:
        model = CurrentAccountEntry
        fields = (
            "current_account",
            "entry_template",
            "cost_center",
            "unit",
            "entry_date",
            "competence_month",
            "kind",
            "amount",
            "description",
            "justification",
        )

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        return super().validate({**attrs, "batch": self.context["batch"]})


class BatchEntriesSerializer(serializers.Serializer[list[CurrentAccountEntry]]):
    """Several manual entries posted into one batch, all or none."""

    entries = BatchEntryLineSerializer(many=True, allow_empty=False)

    @override
    def create(self, validated_data: dict[str, Any]) -> list[CurrentAccountEntry]:
        batch: EntryBatch = self.context["batch"]
        user = self.context["request"].user
        entries = [
            CurrentAccountEntry(company=batch.company, created_by=user, **line)
            for line in validated_data["entries"]
        ]
        return post_entries(entries)
