from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from .models import Pessoa
from .serializers import PessoaSerializer


class PessoaViewSet(viewsets.ModelViewSet):
    """CRUD de Pessoa + busca por nome ou CPF/CNPJ (?search=), reaproveitado
    pelo cadastro de Unidade para vincular proprietário/locatário existente."""

    queryset = Pessoa.objects.all()
    serializer_class = PessoaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ["nome", "cpf_cnpj", "email"]
