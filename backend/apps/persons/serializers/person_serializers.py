from typing import cast, override

from django.db import transaction
from rest_framework import serializers
from typing_extensions import final

from ..models import PeopleIndividual, PeopleLegal, Person
from .people_individual_serializers import PeopleIndividualSerializer
from .people_legal_serializers import PeopleLegalSerializer


@final
class PersonSerializer(serializers.ModelSerializer):
    people_individual = PeopleIndividualSerializer(required=False)
    people_legal = PeopleLegalSerializer(required=False)

    @final
    class Meta:
        model = Person
        fields = (
            "id",
            "name",
            "home_phone",
            "business_phone",
            "cell_number",
            "email",
            "active",
            "people_individual",
            "people_legal",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        individual = cast(dict[str, object], attrs.get("people_individual") or {})
        legal = cast(dict[str, object], attrs.get("people_legal") or {})

        checks = (
            (PeopleIndividual, "people_individual", "cpf", individual),
            (PeopleIndividual, "people_individual", "rg", individual),
            (PeopleLegal, "people_legal", "cnpj", legal),
        )
        for model, key, field, data in checks:
            value = data.get(field)
            if not value:
                continue
            clashes = model.objects.filter(**{field: value})
            if self.instance is not None:
                clashes = clashes.exclude(person=self.instance)
            if clashes.exists():
                raise serializers.ValidationError(
                    {key: {field: f"Already registered: {value}."}}
                )
        return attrs

    @override
    @transaction.atomic
    def create(self, validated_data: dict[str, object]) -> Person:
        individual_data = validated_data.pop("people_individual", None)
        legal_data = validated_data.pop("people_legal", None)

        person = Person.objects.create(**validated_data)

        if individual_data:
            _ = PeopleIndividual.objects.create(person=person, **individual_data)

        if legal_data:
            _ = PeopleLegal.objects.create(person=person, **legal_data)

        return person

    @override
    @transaction.atomic
    def update(
        self, instance: Person, validated_data: dict[str, object]
    ) -> Person:
        individual_data = validated_data.pop("people_individual", None)
        legal_data = validated_data.pop("people_legal", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if individual_data:
            _ = PeopleIndividual.objects.update_or_create(
                person=instance, defaults=individual_data
            )
        if legal_data:
            _ = PeopleLegal.objects.update_or_create(
                person=instance, defaults=legal_data
            )

        return instance
