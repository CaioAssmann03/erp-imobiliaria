from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import CurrentAccount
from ..serializers import CurrentAccountBalancesSerializer, CurrentAccountSerializer


@final
class CurrentAccountViewSet(
    CompanyScopedViewSetMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet[CurrentAccount],
):
    """The current account of a condominium: created once, its balance moves only through entries."""

    queryset = CurrentAccount.objects.select_related("condominium").order_by("condominium__name")
    serializer_class = CurrentAccountSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)

    @extend_schema(responses=CurrentAccountBalancesSerializer, operation_id="current_accounts_balances")
    @action(detail=True, methods=["get"])
    def balances(self, request: Request, pk: str | None = None) -> Response:
        """The balance of the account and of each cost center, summed from the entries."""
        account = self.get_object()
        data = {"balance": account.recalculated_balance(), "cost_centers": account.balances_by_cost_center()}
        return Response(CurrentAccountBalancesSerializer(data).data)
