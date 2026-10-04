from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from ..models import Block
from ..serializers import BlockSerializer


@final
class BlockViewSet(viewsets.ModelViewSet[Block]):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("condominium",)
