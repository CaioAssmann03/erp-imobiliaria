from typing import Any, final

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.persons.models import Person
from apps.persons.serializers import PERSON_FIELDS, PeopleIndividualSerializer, PeopleLegalSerializer

from ..models import UnitPerson


class CondominiumPersonUnitRoleSerializer(serializers.Serializer[Any]):
    role = serializers.ChoiceField(choices=UnitPerson.Role.choices)
    units = serializers.ListField(child=serializers.CharField(), help_text="Names of the units where the person has this role.")


@final
class CondominiumPersonSerializer(serializers.ModelSerializer[Person]):
    """A person of the `persons` list plus the current roles and units they hold in the scope asked (`?condominium=`, `?unit=`)."""

    people_individual = PeopleIndividualSerializer(read_only=True)
    people_legal = PeopleLegalSerializer(read_only=True)
    unit_roles = serializers.SerializerMethodField()

    @final
    class Meta:
        model = Person
        fields = (*PERSON_FIELDS, "unit_roles")
        read_only_fields = fields

    @extend_schema_field(CondominiumPersonUnitRoleSerializer(many=True))
    def get_unit_roles(self, person: Person) -> list[dict[str, Any]]:
        """Owner first, then tenant; the links are the ones the view prefetched as `current_unit_links` (none without a scope)."""
        units_by_role: dict[str, list[str]] = {}
        for link in getattr(person, "current_unit_links", ()):
            units_by_role.setdefault(link.role, []).append(link.unit.name)
        return [
            {"role": role, "units": units_by_role[role]}
            for role in (UnitPerson.Role.OWNER, UnitPerson.Role.TENANT)
            if role in units_by_role
        ]
