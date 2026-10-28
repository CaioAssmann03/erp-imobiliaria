from typing import final, override

from rest_framework import viewsets
from rest_framework.permissions import BasePermission, IsAuthenticated

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.api.permissions import IsSuperuser
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin

from ..models import Company
from ..serializers import CompanySerializer


@final
class CompanyViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Company]):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = (QuerySearchFilter,)
    search_fields = ("legal_name", "trade_name", "cnpj")

    @override
    def get_permissions(self) -> list[BasePermission]:
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperuser()]
        return [IsAuthenticated()]
