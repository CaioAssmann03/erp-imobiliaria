from datetime import date
from typing import Any, final

from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from ..models import (
    BillingDocument,
    BillingDocumentDelivery,
    BillingDocumentItem,
    BillingDocumentPayment,
    BillingDocumentPdf,
    BillingDocumentRegistration,
)


class BillingDocumentItemSerializer(serializers.ModelSerializer[BillingDocumentItem]):
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True, default=None)
    entry_template_name = serializers.CharField(source="entry_template.name", read_only=True, default=None)

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
            "credits_company",
            "amount",
        )
        read_only_fields = fields


class BillingDocumentRegistrationSerializer(serializers.ModelSerializer[BillingDocumentRegistration]):
    """What a payer needs to pay the boleto; the gateway's ids and credentials stay out."""

    @final
    class Meta:
        model = BillingDocumentRegistration
        fields = (
            "id",
            "registered_due_date",
            "our_number",
            "digitable_line",
            "barcode",
            "boleto_url",
            "pix_payload",
            "pix_expires_at",
            "created_at",
        )
        read_only_fields = fields


class BillingDocumentDeliverySerializer(serializers.ModelSerializer[BillingDocumentDelivery]):
    @final
    class Meta:
        model = BillingDocumentDelivery
        fields = ("id", "channel", "status", "destination", "sent_at", "failure_reason")
        read_only_fields = fields


class BillingDocumentPaymentSerializer(serializers.ModelSerializer[BillingDocumentPayment]):
    @final
    class Meta:
        model = BillingDocumentPayment
        fields = ("paid_on", "amount", "net_amount")
        read_only_fields = fields


class BillingDocumentSerializer(serializers.ModelSerializer[BillingDocument]):
    """A unit's boleto as a record. Documents are issued by the monthly issuance; the API only reads and cancels them."""

    condominium = serializers.UUIDField(source="unit.condominium_id", read_only=True)
    condominium_name = serializers.CharField(source="unit.condominium.name", read_only=True)
    unit_name = serializers.CharField(source="unit.name", read_only=True)
    payer_name = serializers.CharField(source="payer.name", read_only=True)
    is_overdue = serializers.SerializerMethodField()
    items = BillingDocumentItemSerializer(many=True, read_only=True)
    registration = serializers.SerializerMethodField()
    delivery = serializers.SerializerMethodField()
    payment = BillingDocumentPaymentSerializer(read_only=True, allow_null=True)

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
            "registration",
            "delivery",
            "payment",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    @extend_schema_field(BillingDocumentRegistrationSerializer(allow_null=True))
    def get_registration(self, document: BillingDocument) -> dict[str, Any] | None:
        active = getattr(document, "active_registrations", None)
        if active is None:
            registration = document.registrations.filter(status=BillingDocumentRegistration.Status.ACTIVE).first()
        else:
            registration = active[0] if active else None
        return None if registration is None else dict(BillingDocumentRegistrationSerializer(registration).data)

    @extend_schema_field(BillingDocumentDeliverySerializer(allow_null=True))
    def get_delivery(self, document: BillingDocument) -> dict[str, Any] | None:
        """The latest delivery of the active registration (the e-mail of the boleto the payer holds now)."""
        registration = getattr(document, "active_registrations", None)
        active = registration[0] if registration else None
        if active is None:
            return None
        delivery = active.deliveries.order_by("-created_at").first()
        return None if delivery is None else dict(BillingDocumentDeliverySerializer(delivery).data)

    @extend_schema_field(serializers.BooleanField())
    def get_is_overdue(self, document: BillingDocument) -> bool:
        return document.is_overdue_on(self._today())

    def _today(self) -> date:
        return timezone.localdate()


class BillingDocumentReissueSerializer(serializers.Serializer[dict[str, Any]]):
    """The due date of the new boleto; whether it may be in the past is the registration model's rule."""

    due_date = serializers.DateField()


class BillingDocumentPdfDownloadSerializer(serializers.Serializer[dict[str, Any]]):
    """A short-lived signed URL to download the document's draft PDF."""

    download_url = serializers.URLField(read_only=True)
    expires_in = serializers.IntegerField(read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)
