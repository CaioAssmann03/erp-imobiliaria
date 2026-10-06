from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from typing_extensions import final

from apps.core.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import AccountPayableFilter
from ..models import AccountPayable
from ..serializers import AccountPayableSerializer, SettleAccountPayableSerializer
from ..services.cancel_account_payable import cancel_account_payable
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
        settle_account_payable(account, AccountPayablePayment(**payment.validated_data, settled_by=request.user))
        return Response(self.get_serializer(account).data)

    @extend_schema(request=None, responses=AccountPayableSerializer, operation_id="accounts_payable_cancel")
    @action(detail=True, methods=["post"])
    def cancel(self, request: Request, pk: str | None = None) -> Response:
        """Cancel an open account."""
        account = self.get_object()
        cancel_account_payable(account)
        return Response(self.get_serializer(account).data)
