from typing import cast, final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.accounts.models import User
from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import CurrentAccountEntryFilter
from ..models import CurrentAccountEntry
from ..serializers import CurrentAccountEntrySerializer, ReverseEntrySerializer
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
