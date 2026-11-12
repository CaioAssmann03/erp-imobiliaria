from typing import Any, final, override

from django.db import transaction
from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.infrastructure.api.filters import QuerySearchFilter
from apps.core.infrastructure.api.permissions import IsSuperuser
from apps.core.infrastructure.scoping import CompanyScopedViewSetMixin, scope_to_company

from ..filters import PersonFilter
from ..models import Person
from ..modules import registered_modules, validate_module
from ..serializers import PersonSerializer
from ..services.anonymize_person import anonymize_person
from ..services.release_person_to_module import release_person_to_module
from ..services.remove_person_from_module import remove_person_from_module


@final
class PersonViewSet(CompanyScopedViewSetMixin, viewsets.ModelViewSet[Person]):
    queryset = Person.objects.select_related("people_individual", "people_legal")
    serializer_class = PersonSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "email", "people_individual__cpf", "people_legal__cnpj")
    search_code_field = "code"
    filterset_class = PersonFilter

    @override
    @extend_schema(
        parameters=[
            OpenApiParameter(
                "person_module",
                str,
                enum=registered_modules(),
                required=False,
                description="Releases the new person to this module in the same request.",
            )
        ]
    )
    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return super().create(request, *args, **kwargs)

    @override
    def perform_create(self, serializer: PersonSerializer) -> None:  # type: ignore[override]
        raw_module = self.request.query_params.get("person_module")
        if raw_module is None:
            serializer.save()
        else:
            serializer.save(module=validate_module(raw_module, "person_module"))

    @override
    def get_queryset(self) -> QuerySet[Person]:
        queryset = super().get_queryset()
        if self.action in ("restore", "anonymize"):
            # A deleted (archived) person is only reachable by these two actions.
            return scope_to_company(Person.all_objects.select_related("people_individual", "people_legal"), self.request.user)
        return queryset

    @extend_schema(request=None, responses={status.HTTP_200_OK: PersonSerializer})
    @action(detail=True, methods=["post"], permission_classes=[IsSuperuser])
    def restore(self, request: Request, pk: str) -> Response:
        """Bring a deleted person back (superuser only)."""
        person = self.get_object()
        person.restore()
        return Response(self.get_serializer(person).data)

    @extend_schema(request=None, responses={status.HTTP_200_OK: PersonSerializer})
    @action(detail=True, methods=["post"], permission_classes=[IsSuperuser])
    def anonymize(self, request: Request, pk: str) -> Response:
        """The LGPD erasure of a deleted person after the retention period; irreversible (superuser only)."""
        person = anonymize_person(self.get_object())
        return Response(self.get_serializer(person).data)

    @extend_schema(request=None, responses={status.HTTP_204_NO_CONTENT: None})
    @action(detail=True, methods=["put", "delete"], url_path=r"modules/(?P<module>[^/.]+)")
    @transaction.atomic
    def module_membership(self, request: Request, pk: str, module: str) -> Response:
        """PUT releases the person to the module, DELETE takes them out; both are idempotent."""
        person = self.get_object()
        validated_module = validate_module(module)
        if request.method == "PUT":
            release_person_to_module(person, validated_module)
        else:
            remove_person_from_module(person, validated_module)
        return Response(status=status.HTTP_204_NO_CONTENT)
