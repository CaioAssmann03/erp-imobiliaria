from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from typing_extensions import final

from apps.core.api.filters import QuerySearchFilter
from apps.core.scoping import CompanyScopedViewSetMixin

from ..models import BankAccount
from ..serializers import BankAccountSerializer


@final
class BankAccountViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[BankAccount]):
    queryset = BankAccount.objects.select_related("company", "condominium")
    serializer_class = BankAccountSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("nickname", "bank_name")
    filterset_fields = ("condominium", "kind", "active")
