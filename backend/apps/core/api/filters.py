from rest_framework import filters
from rest_framework.request import Request


class QuerySearchFilter(filters.SearchFilter):
    """Busca textual por `?query=termo` (mantém `?search=` como alternativa legada).

    Os campos pesquisados vêm de `search_fields` de cada view; os termos são separados
    por espaço e todos precisam casar (comportamento padrão do DRF).
    """

    search_param = "query"
    search_title = "Busca"
    search_description = "Termo de busca (nome, documento…)."

    def get_search_terms(self, request: Request) -> list[str]:
        raw_query = request.query_params.get(self.search_param) or request.query_params.get(
            "search", ""
        )
        return raw_query.replace("\x00", "").replace(",", " ").split()
