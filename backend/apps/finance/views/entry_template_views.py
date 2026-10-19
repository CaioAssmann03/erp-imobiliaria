from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..filters import EntryTemplateFilter
from ..models import EntryTemplate
from ..serializers import EntryTemplateSerializer


@final
class EntryTemplateViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[EntryTemplate]):
    queryset = EntryTemplate.objects.select_related("cost_center__condominium")
    serializer_class = EntryTemplateSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name",)
    filterset_class = EntryTemplateFilter
