from typing import Any, override

from django.db import transaction
from rest_framework import serializers
from typing_extensions import final

from apps.core.scoping import request_company, request_company_or_none
from apps.core.serializers import ModelRulesMixin, build_candidate, run_model_rules

from ..models import PeopleIndividual, PeopleLegal, Person
from .people_individual_serializers import PeopleIndividualSerializer
from .people_legal_serializers import PeopleLegalSerializer


@final
class PersonSerializer(ModelRulesMixin, serializers.ModelSerializer[Person]):
    people_individual = PeopleIndividualSerializer(required=False)
    people_legal = PeopleLegalSerializer(required=False)

    @final
    class Meta:
        model = Person
        fields = (
            "id",
            "company",
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
        read_only_fields = ("company", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs = super().validate(attrs)
        self._validate_document("people_individual", PeopleIndividual, attrs)
        self._validate_document("people_legal", PeopleLegal, attrs)
        return attrs

    def _validate_document(
        self,
        nested_key: str,
        document_model: type[PeopleIndividual] | type[PeopleLegal],
        attrs: dict[str, Any],
    ) -> None:
        """Run the document model's own rules (format, uniqueness) on the nested data.

        On update the existing record is the base, so the person's own CPF/CNPJ is not
        reported as a duplicate.
        """
        document_data = attrs.get(nested_key)
        if not document_data:
            return
        existing_document = (
            document_model.objects.filter(person=self.instance).first() if self.instance else None
        )
        company = self.instance.company if self.instance else request_company_or_none(self)
        candidate = build_candidate(
            document_model, {**document_data, "company": company}, existing_document
        )
        try:
            run_model_rules(candidate, excluded_fields=["person"])
        except serializers.ValidationError as error:
            raise serializers.ValidationError({nested_key: error.detail}) from error

    @override
    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> Person:
        individual_data = validated_data.pop("people_individual", None)
        legal_data = validated_data.pop("people_legal", None)

        person = Person.objects.create(company=request_company(self), **validated_data)

        if individual_data:
            _ = PeopleIndividual.objects.create(
                person=person, company=person.company, **individual_data
            )

        if legal_data:
            _ = PeopleLegal.objects.create(person=person, company=person.company, **legal_data)

        return person

    @override
    @transaction.atomic
    def update(
        self, instance: Person, validated_data: dict[str, Any]
    ) -> Person:
        individual_data = validated_data.pop("people_individual", None)
        legal_data = validated_data.pop("people_legal", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if individual_data:
            _ = PeopleIndividual.objects.update_or_create(
                person=instance, defaults={**individual_data, "company": instance.company}
            )
        if legal_data:
            _ = PeopleLegal.objects.update_or_create(
                person=instance, defaults={**legal_data, "company": instance.company}
            )

        return instance
