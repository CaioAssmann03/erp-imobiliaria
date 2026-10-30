from typing import cast, final

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.condominiums.models import Condominium
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin, scope_to_company

from ..filters import CurrentAccountEntryFilter
from ..models import CurrentAccountEntry
from ..serializers import (
    AccountabilityPageQuerySerializer,
    AccountabilityQuerySerializer,
    AccountabilityReportSerializer,
    CurrentAccountEntrySerializer,
    ReverseEntrySerializer,
)
from ..services.build_accountability_report import AccountabilityPages, AccountabilityReport, build_accountability_report
from ..services.render_accountability_pdf import render_accountability_pdf
from ..services.reverse_entry import reverse_entry


@final
class CurrentAccountEntryViewSet(
    CompanyScopedViewSetMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet[CurrentAccountEntry],
):
    """The statement: newest entries first (by registry). They are never changed or deleted, only reversed."""

    queryset = CurrentAccountEntry.objects.select_related(
        "current_account__condominium", "batch", "entry_template", "cost_center", "unit", "reversal"
    ).order_by("-registry")
    serializer_class = CurrentAccountEntrySerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("description",)
    filterset_class = CurrentAccountEntryFilter

    @extend_schema(
        request=ReverseEntrySerializer,
        responses={status.HTTP_201_CREATED: CurrentAccountEntrySerializer},
        operation_id="current_account_entries_reverse",
    )
    @action(detail=True, methods=["post"])
    def reverse(self, request: Request, pk: str | None = None) -> Response:
        """Cancel this entry with the opposite entry."""
        entry = self.get_object()
        data = ReverseEntrySerializer(data=request.data)
        data.is_valid(raise_exception=True)
        reversed_by = cast(User, request.user)  # IsAuthenticated: never anonymous here
        reversal = reverse_entry(
            entry, data.validated_data["reason"], data.validated_data["reversal_date"], reversed_by
        )
        return Response(self.get_serializer(reversal).data, status=status.HTTP_201_CREATED)

    def _accountability_report(self, request: Request, pages: AccountabilityPages | None = None) -> AccountabilityReport:
        """The month's accountability of a condominium of the user's company (another company's is a 404); `pages` for the screen."""
        query = AccountabilityQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        condominium = get_object_or_404(
            scope_to_company(Condominium.objects.all(), request.user), pk=query.validated_data["condominium"]
        )
        entries = self.get_queryset().filter(current_account__condominium=condominium)
        return build_accountability_report(condominium, query.validated_data["month"], entries, pages)

    @extend_schema(
        parameters=[AccountabilityQuerySerializer, AccountabilityPageQuerySerializer],
        responses=AccountabilityReportSerializer,
        operation_id="current_account_entries_accountability",
    )
    @action(detail=False, methods=["get"])
    def accountability(self, request: Request) -> Response:
        """Report: a condominium's month in the ledger, opening and closing balance, per sub-conta, with the entries; both lists come 10 per page by default (`?page_size=` up to 100)."""
        page_query = AccountabilityPageQuerySerializer(data=request.query_params)
        _ = page_query.is_valid(raise_exception=True)
        pages = AccountabilityPages(
            cost_centers=page_query.validated_data["cost_centers_page"],
            entries=page_query.validated_data["entries_page"],
            size=page_query.validated_data["page_size"],
        )
        return Response(AccountabilityReportSerializer(self._accountability_report(request, pages)).data)

    @extend_schema(
        parameters=[AccountabilityQuerySerializer],
        responses={(200, "application/pdf"): OpenApiTypes.BINARY},
        operation_id="current_account_entries_accountability_pdf",
    )
    @action(detail=False, methods=["get"], url_path="accountability/pdf")
    def accountability_pdf(self, request: Request) -> HttpResponse:
        """The same report as a PDF download."""
        report = self._accountability_report(request)
        company = getattr(request.user, "company", None)
        content = render_accountability_pdf(report, company.legal_name if company else "")
        response = HttpResponse(content, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="prestacao-de-contas-{report.condominium_code:04d}-{report.month:%Y-%m}.pdf"'
        )
        return response
