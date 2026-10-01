from rest_framework import filters


class QuerySearchFilter(filters.SearchFilter):
    """Busca textual por `?query=termo` (mantém `?search=` como alternativa legada).

    Os campos pesquisados vêm de `search_fields` de cada view; os termos são separados
    por espaço e todos precisam casar (comportamento padrão do DRF).
    """

    search_param = "query"
    search_title = "Busca"
    search_description = "Termo de busca (nome, documento…)."

    def get_search_terms(self, request):
        value = request.query_params.get(self.search_param) or request.query_params.get("search", "")
        return value.replace("\x00", "").replace(",", " ").split()
