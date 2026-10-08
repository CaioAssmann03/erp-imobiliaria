from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from typing_extensions import final

from apps.core.scoping import CompanyScopedViewSetMixin
from apps.core.storage import object_storage

from ..models import PaymentReceipt
from ..models.payment_receipt import DOWNLOAD_URL_TTL_SECONDS
from ..serializers import PaymentReceiptDownloadSerializer, PaymentReceiptSerializer
from ..services.confirm_payment_receipt import confirm_payment_receipt
from ..services.delete_payment_receipt import delete_payment_receipt

# Actions that show only receipts whose file was checked in the bucket.
CONFIRMED_ONLY_ACTIONS = ("list", "retrieve", "download_url")


@final
class PaymentReceiptViewSet(
    CompanyScopedViewSetMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet[PaymentReceipt],
):
    queryset = PaymentReceipt.objects.select_related("uploaded_by")
    serializer_class = PaymentReceiptSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("account_payable",)

    def get_queryset(self):  # type: ignore[no-untyped-def]
        queryset = super().get_queryset()
        if self.action in CONFIRMED_ONLY_ACTIONS:
            return queryset.filter(confirmed_at__isnull=False)
        return queryset

    @extend_schema(request=None, responses=PaymentReceiptSerializer, operation_id="payment_receipts_confirm")
    @action(detail=True, methods=["post"])
    def confirm(self, request: Request, pk: str | None = None) -> Response:
        """Check the uploaded file in the bucket and make the receipt visible."""
        receipt = confirm_payment_receipt(self.get_object())
        return Response(self.get_serializer(receipt).data)

    @extend_schema(
        responses=PaymentReceiptDownloadSerializer,
        operation_id="payment_receipts_download_url",
    )
    @action(detail=True, methods=["get"], url_path="download-url", url_name="download-url")
    def download_url(self, request: Request, pk: str | None = None) -> Response:
        """A temporary signed URL that makes the browser save the file under its original name."""
        receipt = self.get_object()
        url = object_storage.get_object_storage().presigned_download_url(
            receipt.file_key, receipt.original_name, DOWNLOAD_URL_TTL_SECONDS
        )
        return Response({"download_url": url, "expires_in": DOWNLOAD_URL_TTL_SECONDS})

    @extend_schema(operation_id="payment_receipts_destroy")
    def destroy(self, request: Request, *args: object, **kwargs: object) -> Response:
        delete_payment_receipt(self.get_object())
        return Response(status=204)
