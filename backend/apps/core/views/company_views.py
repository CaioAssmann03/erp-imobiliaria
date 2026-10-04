from rest_framework import viewsets
from typing_extensions import final

from apps.core.filters import QuerySearchFilter

from ..models import Company
from ..serializers import CompanySerializer


@final
class CompanyViewSet(viewsets.ModelViewSet[Company]):
    """CRUD de Company (administradora) — base do modelo multiempresa."""

    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = (QuerySearchFilter,)
    search_fields = ("legal_name", "trade_name", "cnpj")
