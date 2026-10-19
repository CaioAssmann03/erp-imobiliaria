from typing import cast, final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import AccountPayableFilter
from ..models import AccountPayable
from ..serializers import (
    AccountPayableSerializer,
    CreatePaymentReceiptSerializer,
    PaymentReceiptUploadSerializer,
    SettleAccountPayableSerializer,
)
from ..services.cancel_account_payable import cancel_account_payable
from ..services.create_payment_receipt import ReceiptFile, create_payment_receipt
from ..services.settle_account_payable import (
    AccountPayablePayment,
    settle_account_payable,
)


@final
class AccountPayableViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[AccountPayable]):
    queryset = AccountPayable.objects.select_related("supplier__person", "condominium", "cost_center", "entry_template")
    serializer_class = AccountPayableSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("description", "document_number", "supplier__person__name")
    filterset_class = AccountPayableFilter

    @extend_schema(
        request=SettleAccountPayableSerializer,
        responses=AccountPayableSerializer,
        operation_id="accounts_payable_settle",
    )
    @action(detail=True, methods=["post"])
    def settle(self, request: Request, pk: str | None = None) -> Response:
        """Pay ("baixa") an open account."""
        account = self.get_object()
        payment = SettleAccountPayableSerializer(data=request.data)
        payment.is_valid(raise_exception=True)
        settled_by = cast(User, request.user)  # IsAuthenticated: never anonymous here
        settle_account_payable(account, AccountPayablePayment(**payment.validated_data, settled_by=settled_by))
        return Response(self.get_serializer(account).data)

    @extend_schema(request=None, responses=AccountPayableSerializer, operation_id="accounts_payable_cancel")
    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: str | None = None) -> Response:
        """Cancel an open account."""
        account = self.get_object()
        cancel_account_payable(account)
        return Response(self.get_serializer(account).data)

    @extend_schema(
        request=CreatePaymentReceiptSerializer,
        responses={201: PaymentReceiptUploadSerializer},
        operation_id="accounts_payable_receipts_create",
    )
    @action(detail=True, methods=["post"], url_path="receipts", url_name="receipts")
    def receipts(self, request: Request, pk: str | None = None) -> Response:
        """Register a receipt file of a paid account and answer the signed URL to upload it to."""
        account = self.get_object()
        file = CreatePaymentReceiptSerializer(data=request.data)
        file.is_valid(raise_exception=True)
        upload = create_payment_receipt(account, ReceiptFile(**file.validated_data), request.user)  # type: ignore[arg-type]
        return Response(
            {
                "id": upload.receipt.pk,
                "upload_url": upload.upload_url,
                "upload_headers": {"Content-Type": upload.receipt.content_type},
                "expires_in": upload.expires_in,
            },
            status=201,
        )
