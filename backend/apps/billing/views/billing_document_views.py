from typing import final

from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
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
from ..gateway.asaas_client import GatewayError, GatewayUnavailable
from ..models import BillingDocument, BillingDocumentItem, BillingDocumentPdf, BillingDocumentRegistration
from ..models.billing_document_pdf import DOWNLOAD_URL_TTL_SECONDS
from ..serializers import (
    BillingDocumentPdfDownloadSerializer,
    BillingDocumentReissueSerializer,
    BillingDocumentSerializer,
)
from ..services.cancel_billing_document import cancel_billing_document
from ..services.generate_billing_document_pdf import generate_billing_document_pdf
from ..services.reissue_billing_document import reissue_billing_document


class GatewayNotAvailable(APIException):
    """The gateway did not answer: the staff action can be tried again later."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = GatewayAccountError.GATEWAY_UNAVAILABLE.message
    default_code = GatewayAccountError.GATEWAY_UNAVAILABLE.value


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
