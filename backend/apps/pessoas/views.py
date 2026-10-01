from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from apps.core.filters import QuerySearchFilter

from .models import Pessoa
from .serializers import PessoaSerializer


class PessoaViewSet(viewsets.ModelViewSet):
    """CRUD de Pessoa + busca por nome ou CPF/CNPJ (?query=), reaproveitado
    pelo cadastro de Unidade para vincular proprietário/locatário existente."""

    queryset = Pessoa.objects.all()
    serializer_class = PessoaSerializer
    filter_backends = [DjangoFilterBackend, QuerySearchFilter]
    search_fields = ["nome", "cpf_cnpj", "email"]
    filterset_fields = ["ativo", "tipo_pessoa"]
