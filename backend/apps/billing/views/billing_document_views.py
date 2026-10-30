from typing import final

from django.db.models import Prefetch
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, NotFound
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin
from apps.core.infrastructure.storage import object_storage

from ..errors import BillingDocumentPdfError, GatewayAccountError
from ..filters import BillingDocumentFilter
from ..infrastructure.gateway.asaas_client import GatewayError, GatewayUnavailable
from ..models import BillingDocument, BillingDocumentItem, BillingDocumentPdf, BillingDocumentRegistration
from ..models.billing_document_pdf import DOWNLOAD_URL_TTL_SECONDS
from ..serializers import (
    BillingDocumentPdfDownloadSerializer,
    BillingDocumentReissueSerializer,
    BillingDocumentSerializer,
    BillingMonthSummaryQuerySerializer,
    BillingMonthSummarySerializer,
    DelinquencyQuerySerializer,
    DelinquencyReportSerializer,
    ExtraBillingDocumentSerializer,
    ExtraBillingResultSerializer,
)
from ..services.build_billing_month_summary import build_billing_month_summary
from ..services.cancel_billing_document import cancel_billing_document
from ..services.build_delinquency_report import DelinquencyPage, DelinquencyReport, build_delinquency_report
from ..services.issue_extra_billing_document import issue_extra_billing_document
from ..services.generate_billing_document_pdf import generate_billing_document_pdf
from ..services.render_delinquency_pdf import render_delinquency_pdf
from ..services.reissue_billing_document import reissue_billing_document


class GatewayNotAvailable(APIException):
    """The gateway did not answer: the staff action can be tried again later."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = GatewayAccountError.GATEWAY_UNAVAILABLE.message
    default_code = GatewayAccountError.GATEWAY_UNAVAILABLE.value


DELINQUENCY_FILTERS = [
    OpenApiParameter("condominium", OpenApiTypes.UUID, description="Only this condominium's boletos"),
    OpenApiParameter("reference_month", OpenApiTypes.DATE, description="Only the boletos of this reference month (first day)"),
]


@final
class BillingDocumentViewSet(CompanyScopedViewSetMixin, viewsets.ReadOnlyModelViewSet[BillingDocument]):
    """Billing documents of the units: list and retrieve, and cancel one that is not paid."""

    queryset = BillingDocument.objects.select_related("unit__condominium", "payer", "payment").prefetch_related(
        Prefetch(
            "items",
            queryset=BillingDocumentItem.objects.select_related("cost_center", "entry_template"),
        ),
        Prefetch(
            "registrations",
            queryset=BillingDocumentRegistration.objects.filter(status=BillingDocumentRegistration.Status.ACTIVE).prefetch_related(
                "deliveries"
            ),
            to_attr="active_registrations",
        ),
    )
    serializer_class = BillingDocumentSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("unit__name", "payer__name")
    filterset_class = BillingDocumentFilter

    @extend_schema(request=None, responses=BillingDocumentSerializer, operation_id="billing_documents_cancel")
    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: str | None = None) -> Response:
        """Cancel an issued or registered document."""
        document = self.get_object()
        cancel_billing_document(document)
        return Response(self.get_serializer(document).data)

    @extend_schema(
        request=ExtraBillingDocumentSerializer,
        responses={201: ExtraBillingResultSerializer, 200: ExtraBillingResultSerializer},
        operation_id="billing_documents_extra",
    )
    @action(detail=False, methods=["post"])
    def extra(self, request: Request) -> Response:
        """Issue an extra boleto, outside the monthly issuance, to each selected unit (spec 054).

        201 when at least one unit was issued; the units that could not be are listed in `skipped`.
        """
        serializer = ExtraBillingDocumentSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        issuance = issue_extra_billing_document(
            data["condominium"], data["units"], data["lines"], data["due_date"], data["competence_month"]
        )
        body = ExtraBillingResultSerializer(
            {"issued": issuance.issued, "skipped": issuance.skipped}, context=self.get_serializer_context()
        ).data
        return Response(body, status=status.HTTP_201_CREATED if issuance.issued else status.HTTP_200_OK)

    @extend_schema(request=BillingDocumentReissueSerializer, responses=BillingDocumentSerializer, operation_id="billing_documents_reissue")
    @action(detail=True, methods=["post"])
    def reissue(self, request: Request, pk: str | None = None) -> Response:
        """Replace the document's boleto with a new charge due on the given date (staff action; the old one is kept and cancelled)."""
        document = self.get_object()
        serializer = BillingDocumentReissueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            _ = reissue_billing_document(document, serializer.validated_data["due_date"])
        except GatewayUnavailable as error:
            raise GatewayNotAvailable(str(error)) from error
        except GatewayError as error:
            raise error.error.to_validation_error() from error
        return Response(self.get_serializer(self.get_object()).data)

    @extend_schema(
        request=None,
        responses={200: BillingDocumentPdfDownloadSerializer, 201: BillingDocumentPdfDownloadSerializer},
        operation_id="billing_documents_pdf",
    )
    @action(detail=True, methods=["get", "post"])
    def pdf(self, request: Request, pk: str | None = None) -> Response:
        """GET: a signed URL to download the draft PDF (404 until it exists). POST: generate or replace it now."""
        document = self.get_object()
        status_code: int = status.HTTP_200_OK
        if request.method == "POST":
            if not BillingDocumentPdf.objects.filter(document=document).exists():
                status_code = status.HTTP_201_CREATED
            pdf = generate_billing_document_pdf(document)
        else:
            stored_pdf = BillingDocumentPdf.objects.filter(document=document).first()
            if stored_pdf is None:
                raise NotFound(BillingDocumentPdfError.NOT_GENERATED.message, code=BillingDocumentPdfError.NOT_GENERATED.value)
            pdf = stored_pdf
        storage = object_storage.get_object_storage()
        file_name = f"boleto-rascunho-{document.unit.name}-{document.reference_month:%Y-%m}.pdf"
        download_url = storage.presigned_download_url(pdf.file_key, file_name, DOWNLOAD_URL_TTL_SECONDS)
        body = {"download_url": download_url, "expires_in": DOWNLOAD_URL_TTL_SECONDS, "generated_at": pdf.generated_at}
        return Response(BillingDocumentPdfDownloadSerializer(body).data, status=status_code)

    def _delinquency_report(self, page: DelinquencyPage | None = None) -> DelinquencyReport:
        """The overdue report over what the user may see and the filters ask (`?condominium=`, `?reference_month=`); `page` for the screen."""
        return build_delinquency_report(self.filter_queryset(self.get_queryset()), timezone.localdate(), page)

    @extend_schema(
        parameters=[*DELINQUENCY_FILTERS, DelinquencyQuerySerializer],
        responses=DelinquencyReportSerializer,
        operation_id="billing_documents_delinquency",
    )
    @action(detail=False, methods=["get"])
    def delinquency(self, request: Request) -> Response:
        """Report: the boletos awaiting payment past their due date, with the days late and the totals; the rows come 10 per page by default (`?page=`, `?page_size=` up to 100)."""
        query = DelinquencyQuerySerializer(data=request.query_params)
        _ = query.is_valid(raise_exception=True)
        page = DelinquencyPage(number=query.validated_data["page"], size=query.validated_data["page_size"])
        return Response(DelinquencyReportSerializer(self._delinquency_report(page)).data)

    @extend_schema(
        parameters=[BillingMonthSummaryQuerySerializer],
        responses=BillingMonthSummarySerializer(many=True),
        operation_id="billing_documents_summary",
    )
    @action(detail=False, methods=["get"], pagination_class=None)
    def summary(self, request: Request) -> Response:
        """The boletos issued, paid and open per reference month over the last months (default 6), for the dashboard."""
        query = BillingMonthSummaryQuerySerializer(data=request.query_params)
        _ = query.is_valid(raise_exception=True)
        lines = build_billing_month_summary(
            self.filter_queryset(self.get_queryset()), query.validated_data["months"], timezone.localdate()
        )
        return Response(BillingMonthSummarySerializer(lines, many=True).data)

    @extend_schema(
        parameters=DELINQUENCY_FILTERS,
        responses={(200, "application/pdf"): OpenApiTypes.BINARY},
        operation_id="billing_documents_delinquency_pdf",
    )
    @action(detail=False, methods=["get"], url_path="delinquency/pdf")
    def delinquency_pdf(self, request: Request) -> HttpResponse:
        """The same report as a PDF download."""
        report = self._delinquency_report()
        company = getattr(request.user, "company", None)
        content = render_delinquency_pdf(report, company.legal_name if company else "")
        response = HttpResponse(content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="inadimplencia-{report.as_of:%Y-%m-%d}.pdf"'
        return response
