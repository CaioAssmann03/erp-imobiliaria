from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Paginação padrão: `?page=2&limit=50` (limit máximo 100, padrão 20)."""

    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100
