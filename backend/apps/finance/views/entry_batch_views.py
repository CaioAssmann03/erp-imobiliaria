from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..filters import EntryBatchFilter
from ..models import EntryBatch
from ..serializers import (
    BatchEntriesSerializer,
    CurrentAccountEntrySerializer,
    EntryBatchSerializer,
)


@final
class EntryBatchViewSet(
    CompanyScopedViewSetMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet[EntryBatch],
):
    """Groups ledger entries; a batch is never deleted through the API."""

    queryset = EntryBatch.objects.order_by("-batch_date", "-created_at")
    serializer_class = EntryBatchSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = EntryBatchFilter

    @extend_schema(
        request=BatchEntriesSerializer,
        responses={status.HTTP_201_CREATED: CurrentAccountEntrySerializer(many=True)},
        operation_id="entry_batches_post_entries",
    )
    @action(detail=True, methods=["post"], url_path="entries")
    def post_entries(self, request: Request, pk: str | None = None) -> Response:
        """Post several manual entries into this batch (they may cover several condominiums); all or none."""
        batch = self.get_object()
        serializer = BatchEntriesSerializer(data=request.data, context={**self.get_serializer_context(), "batch": batch})
        serializer.is_valid(raise_exception=True)
        entries = serializer.save()
        return Response(CurrentAccountEntrySerializer(entries, many=True).data, status=status.HTTP_201_CREATED)
