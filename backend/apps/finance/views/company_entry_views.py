from typing import final

from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import CompanyEntry
from ..serializers import CompanyBalanceSerializer, CompanyEntrySerializer


@final
class CompanyEntryViewSet(CompanyScopedViewSetMixin, viewsets.ReadOnlyModelViewSet[CompanyEntry]):
    """The administradora's own ledger (the registration fees): list, filter by date, and the balance."""

    queryset = CompanyEntry.objects.select_related("billing_document_item__document__unit__condominium")
    serializer_class = CompanyEntrySerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("description",)
    filterset_fields = {"entry_date": ["gte", "lte"]}

    @extend_schema(responses=CompanyBalanceSerializer, operation_id="company_entries_balance")
    @action(detail=False, methods=["get"])
    def balance(self, request: Request) -> Response:
        """The sum of the entries the filters leave (the whole ledger without them)."""
        total = self.filter_queryset(self.get_queryset()).aggregate(total=Sum("amount"))["total"] or 0
        return Response({"balance": total})
