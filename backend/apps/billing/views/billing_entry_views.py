from typing import Any, final

from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..filters import BillingEntryFilter
from ..models import BillingEntry, BillingEntryUnit
from ..serializers import (
    BillingEntryEndSerializer,
    BillingEntryPreviewSerializer,
    BillingEntrySerializer,
    reference_month_of,
)
from ..services.end_billing_entry import end_billing_entry
from ..services.preview_billing_entry import preview_billing_entry


@final
class BillingEntryViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[BillingEntry]):
    """The values launched for the boletos (*Inclusão de valores*): list a condominium's month, create, change, end."""

    queryset = BillingEntry.objects.select_related(
        "condominium", "event", "cost_center", "apportionment_criterion"
    ).prefetch_related(
        Prefetch("entry_units", queryset=BillingEntryUnit.objects.select_related("unit"))
    )
    serializer_class = BillingEntrySerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = BillingEntryFilter

    def get_serializer_context(self) -> dict[str, Any]:
        context = dict(super().get_serializer_context())
        month = self.request.query_params.get("reference_month") if self.request else None
        context["reference_month"] = reference_month_of(month) if month else None
        return context

    @extend_schema(
        request=BillingEntrySerializer,
        responses=BillingEntryPreviewSerializer,
        parameters=[
            OpenApiParameter(
                "reference_month",
                OpenApiTypes.DATE,
                description="Month to show; the entry's start month by default.",
            )
        ],
        operation_id="billing_entries_preview",
    )
    @action(detail=False, methods=["post"])
    def preview(self, request: Request) -> Response:
        """The per-unit values of an entry that is not saved yet."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data: dict[str, Any] = dict(serializer.validated_data)
        data["units"] = data.pop("entry_units")
        reference_month = reference_month_of(
            request.query_params.get("reference_month") or data["start_month"]
        )
        preview = preview_billing_entry(data, reference_month)
        return Response(
            {
                "reference_month": preview.reference_month,
                "total": preview.total,
                "unit_amounts": [
                    {"unit": unit.pk, "unit_name": unit.name, "amount": amount}
                    for unit, amount in preview.unit_amounts
                ],
            }
        )

    @extend_schema(
        request=BillingEntryEndSerializer,
        responses=BillingEntrySerializer,
        operation_id="billing_entries_end",
    )
    @action(detail=True, methods=["post"])
    def end(self, request: Request, pk: str | None = None) -> Response:
        """Stop an entry that repeats always after the given month."""
        entry = self.get_object()
        body = BillingEntryEndSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        ended = end_billing_entry(entry, reference_month_of(body.validated_data["end_month"]))
        return Response(self.get_serializer(ended).data, status=status.HTTP_200_OK)
