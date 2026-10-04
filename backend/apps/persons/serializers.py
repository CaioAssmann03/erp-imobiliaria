from typing import cast, override

from rest_framework import serializers
from typing_extensions import final

from apps.persons.types import PersonValidatedData

from .models import Person, people_individual, people_legal


class PeopleIndividualSerializer(serializers.ModelSerializer):
    @final
    class Meta:
        model = people_individual
        fields = ("cpf", "rg", "birthday", "marital_status", "job")


class PeopleLegalSerializer(serializers.ModelSerializer):
    @final
    class Meta:
        model = people_legal
        fields = ("cnpj", "ie")


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
            "cell_phone",
            "email",
            "active",
            "people_individual",
            "people_legal",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    @override
    def create(self, validated_data: dict[str, object]) -> Person:

        data = cast(PersonValidatedData, cast(object, validated_data))

        individual_data = data.pop("people_individual", None)
        legal_data = data.pop("people_legal", None)

        person = Person.objects.create(**validated_data)

        if individual_data:
            _ = people_individual.objects.create(person=person, **individual_data)

        if legal_data:
            _ = people_legal.objects.create(person=person, **legal_data)

        return person

    @override
    def update(self, instance: Person, validated_data: dict[str, object]):

        data = cast(PersonValidatedData, cast(object, validated_data))

        individual_data = data.pop("people_individual", None)
        legal_data = data.pop("people_legal", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if individual_data:
            _ = people_individual.objects.update_or_create(
                person=instance, **individual_data
            )
        if legal_data:
            _ = people_legal.objects.update_or_create(person=instance, **legal_data)

        return instance
