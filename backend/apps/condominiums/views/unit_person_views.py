from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import UnitPerson
from ..serializers import UnitPersonSerializer


@final
class UnitPersonViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[UnitPerson]):
    queryset = UnitPerson.objects.select_related("unit", "person__people_individual", "person__people_legal")
    serializer_class = UnitPersonSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("unit", "person", "role")
