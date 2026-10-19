from typing import final

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import Supplier
from ..serializers import SupplierSerializer


@final
class SupplierViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Supplier]):
    queryset = Supplier.objects.select_related("person__people_individual", "person__people_legal")
    serializer_class = SupplierSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    # The person's name and document are searchable; payment data (bank, PIX key) is not.
    search_fields = ("person__name", "person__people_individual__cpf", "person__people_legal__cnpj")
    filterset_fields = ("person", "active")
