from datetime import date
from typing import Any, final

from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import BillingDocument, BillingDocumentItem, BillingDocumentPdf


class BillingDocumentItemSerializer(serializers.ModelSerializer[BillingDocumentItem]):
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True)
    entry_template_name = serializers.CharField(source="entry_template.name", read_only=True)

    @final
    class Meta:
        model = BillingDocumentItem
        fields = (
            "id",
            "position",
            "description",
            "cost_center",
            "cost_center_name",
            "entry_template",
            "entry_template_name",
            "amount",
        )
        read_only_fields = fields


class BillingDocumentSerializer(serializers.ModelSerializer[BillingDocument]):
    """A unit's boleto as a record. Documents are issued by the monthly issuance; the API only reads and cancels them."""

    condominium = serializers.UUIDField(source="unit.condominium_id", read_only=True)
    condominium_name = serializers.CharField(source="unit.condominium.name", read_only=True)
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    payer_name = serializers.CharField(source="payer.name", read_only=True)
    is_overdue = serializers.SerializerMethodField()
    items = BillingDocumentItemSerializer(many=True, read_only=True)

    @final
    class Meta:
        model = BillingDocument
        fields = (
            "id",
            "condominium",
            "condominium_name",
            "unit",
            "unit_name",
            "payer",
            "payer_name",
            "reference_month",
            "competence_month",
            "due_date",
            "amount",
            "status",
            "is_overdue",
            "discount_percentage",
            "discount_days",
            "late_fee_percentage",
            "initial_late_fee_percentage",
            "initial_late_fee_days",
            "interest_calculation",
            "interest_grace_days",
            "monthly_interest_percentage",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    @extend_schema_field(serializers.BooleanField())
    def get_is_overdue(self, document: BillingDocument) -> bool:
        return document.is_overdue_on(self._today())

    def _today(self) -> date:
        return timezone.localdate()


class BillingDocumentPdfDownloadSerializer(serializers.Serializer[dict[str, Any]]):
    """A short-lived signed URL to download the document's draft PDF."""

    download_url = serializers.URLField(read_only=True)
    expires_in = serializers.IntegerField(read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)
