import uuid
from typing import final, override

from django.db.models import QuerySet
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, serializers, viewsets

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin
from apps.persons.filters import PersonFilter
from apps.persons.models import Person
from apps.persons.serializers import PersonSerializer

from ..models import UnitPerson


@final
@extend_schema(
    parameters=[
        OpenApiParameter(
            "condominium",
            OpenApiTypes.UUID,
            required=False,
            description="Only the people with a current owner or tenant link to a unit of this condominium.",
        ),
        OpenApiParameter(
            "unit",
            OpenApiTypes.UUID,
            required=False,
            description="Only the people with a current owner or tenant link to this unit.",
        ),
    ]
)
class CondominiumPeopleViewSet(CompanyScopedViewSetMixin, mixins.ListModelMixin, viewsets.GenericViewSet[Person]):
    """The people of the condominiums: the `persons` list (same filters, search and payload) narrowed by `?condominium=` and `?unit=`.

    It lives here because `persons` must not know the condominiums.
    """

    queryset = Person.objects.select_related("people_individual", "people_legal")
    serializer_class = PersonSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "email", "people_individual__cpf", "people_legal__cnpj")
    search_code_field = "code"
    filterset_class = PersonFilter

    @override
    def get_queryset(self) -> QuerySet[Person]:
        queryset = super().get_queryset()
        condominium_id = self._uuid_param("condominium")
        unit_id = self._uuid_param("unit")
        if condominium_id is None and unit_id is None:
            return queryset
        current_links = UnitPerson.objects.current(timezone.localdate())
        if condominium_id is not None:
            current_links = current_links.filter(unit__condominium_id=condominium_id)
        if unit_id is not None:
            current_links = current_links.filter(unit_id=unit_id)
        return queryset.filter(pk__in=current_links.values("person_id"))

    def _uuid_param(self, name: str) -> uuid.UUID | None:
        raw_value = self.request.query_params.get(name)
        if raw_value is None:
            return None
        try:
            return uuid.UUID(raw_value)
        except ValueError:
            raise serializers.ValidationError({name: ["Enter a valid UUID."]}) from None
